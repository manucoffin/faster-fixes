import { prisma } from "@workspace/db";

import type { SlackOAuthGrant } from "./slack-client";
import { encryptSlackToken } from "./token-crypto";

/**
 * Records the Installation for the Organization, or refreshes the workspace and
 * the bot token of one already recorded. One Installation per Organization, so
 * connecting a second Slack workspace overwrites the row rather than adding a
 * second one, and the Project links of the first survive untouched.
 *
 * The bot token is encrypted here rather than by the caller: a route that
 * handled it in clear would be one place too many for it to leak from.
 */
export async function upsertSlackInstallation({
  organizationId,
  installedById,
  grant,
}: {
  organizationId: string;
  installedById: string;
  grant: SlackOAuthGrant;
}) {
  const installationColumns = {
    slackTeamId: grant.teamId,
    slackTeamName: grant.teamName,
    botToken: encryptSlackToken(grant.botToken),
    botUserId: grant.botUserId,
    scope: grant.scope,
    installedById,
  };

  await prisma.slackInstallation.upsert({
    where: { organizationId },
    update: installationColumns,
    create: { organizationId, ...installationColumns },
  });
}
