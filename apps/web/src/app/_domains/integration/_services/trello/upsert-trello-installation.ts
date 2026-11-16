import { prisma } from "@workspace/db";

import type { TrelloMember, TrelloTokenResponse } from "./trello-client";
import { encryptToken } from "./token-crypto";

/**
 * Records the Installation for the Organization, or refreshes the member and
 * the tokens of one already recorded. One Installation per Organization, so
 * reconnecting overwrites the row rather than adding a second one, and Project
 * links survive untouched.
 *
 * Tokens are encrypted here rather than by the caller: a route that handled
 * them in clear would be one place too many for them to leak from.
 */
export async function upsertTrelloInstallation({
  organizationId,
  installedById,
  member,
  tokens,
}: {
  organizationId: string;
  installedById: string;
  member: TrelloMember;
  tokens: TrelloTokenResponse;
}) {
  const installationColumns = {
    trelloMemberId: member.id,
    memberDisplayName: member.fullName || member.username,
    accessToken: encryptToken(tokens.access_token),
    refreshToken: tokens.refresh_token
      ? encryptToken(tokens.refresh_token)
      : null,
    tokenScope: tokens.scope,
    tokenExpiresAt: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null,
    healthState: "connected",
    // Reconnecting re-arms the Reconnect required email for the next refusal.
    reconnectNotifiedAt: null,
    installedById,
  };

  await prisma.trelloInstallation.upsert({
    where: { organizationId },
    update: installationColumns,
    create: { organizationId, ...installationColumns },
    select: { id: true },
  });
}
