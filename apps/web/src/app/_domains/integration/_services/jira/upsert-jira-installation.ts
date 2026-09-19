import { inngest } from "@/server/inngest";
import { prisma } from "@workspace/db";

import type { JiraAccessibleResource, JiraTokenResponse } from "./jira-client";
import { encryptToken } from "./token-crypto";

/**
 * Records the Installation for the Organization, or refreshes the site and the
 * tokens of one already recorded. One Installation per Organization, so
 * reconnecting overwrites the row rather than adding a second one, and Project
 * links survive untouched so sync resumes as it was.
 *
 * Exactly one site is persisted per Organization either way. A grant covering a
 * single site is stored as connected; a grant covering several stores the first
 * as a provisional selection and reports back that the site picker still has to
 * settle it. The picker re-reads the live accessible resources rather than
 * trusting the stored list, so no re-exchange (which would rotate the refresh
 * token) is needed.
 *
 * Tokens are encrypted here rather than by the caller: a route that handled
 * them in clear would be one place too many for them to leak from.
 *
 * `sites` must carry at least one site; a grant that covers none is a refusal
 * the caller answers before recording anything.
 */
export async function upsertJiraInstallation({
  organizationId,
  installedById,
  sites,
  tokens,
}: {
  organizationId: string;
  installedById: string;
  sites: JiraAccessibleResource[];
  tokens: JiraTokenResponse;
}) {
  const siteSelectionPending = sites.length > 1;
  const provisional = sites[0]!;

  const installationColumns = {
    cloudId: provisional.id,
    siteUrl: provisional.url,
    siteName: provisional.name,
    accessToken: encryptToken(tokens.access_token),
    refreshToken: tokens.refresh_token
      ? encryptToken(tokens.refresh_token)
      : null,
    tokenScope: tokens.scope,
    tokenExpiresAt: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null,
    healthState: siteSelectionPending ? "pending_site_selection" : "connected",
    // Reconnecting re-arms the revocation email for the next time it happens.
    reconnectNotifiedAt: null,
    installedById,
  };

  const installation = await prisma.jiraInstallation.upsert({
    where: { organizationId },
    update: installationColumns,
    create: { organizationId, ...installationColumns },
    select: { id: true },
  });

  // Registrations may have lapsed while the grant was dead — Jira expires them
  // after 30 days regardless of why nobody refreshed them. Waiting for the
  // weekly cron would leave inbound sync quiet for up to a week after a
  // reconnect the user was told resumes syncing, so renew (or re-register)
  // immediately. A provisional selection waits for the picker instead, which
  // owes the same renewal once the site is settled.
  if (!siteSelectionPending) {
    await inngest.send({
      name: "jira/webhooks.refresh-requested",
      data: { installationId: installation.id },
    });
  }

  return { siteSelectionPending };
}
