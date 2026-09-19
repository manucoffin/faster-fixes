import { prisma } from "@workspace/db";

import type { LinearOrganizationSummary } from "./find-linear-organization";
import type { LinearOAuthTokenResponse } from "./linear-client";
import { encryptToken } from "./token-crypto";

/**
 * Records the Installation for the Organization, or refreshes the Linear
 * organization and the tokens of one already recorded. One Installation per
 * Organization, so reconnecting to another Linear workspace overwrites the row
 * rather than adding a second one.
 *
 * Tokens are encrypted here rather than by the caller: a route that handled
 * them in clear would be one place too many for them to leak from.
 */
export async function upsertLinearInstallation({
  organizationId,
  installedById,
  organization,
  tokens,
}: {
  organizationId: string;
  installedById: string;
  organization: LinearOrganizationSummary;
  tokens: LinearOAuthTokenResponse;
}) {
  const installationColumns = {
    linearOrgId: organization.id,
    linearOrgName: organization.name,
    linearOrgUrlKey: organization.urlKey,
    accessToken: encryptToken(tokens.access_token),
    refreshToken: tokens.refresh_token
      ? encryptToken(tokens.refresh_token)
      : null,
    tokenScope: tokens.scope,
    tokenExpiresAt: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null,
    installedById,
  };

  await prisma.linearInstallation.upsert({
    where: { organizationId },
    update: installationColumns,
    create: { organizationId, ...installationColumns },
  });
}
