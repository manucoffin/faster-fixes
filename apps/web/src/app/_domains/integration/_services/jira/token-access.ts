import { inngest } from "@/server/inngest";
import { buildEvent, jiraOAuthRevokedEvent } from "@/server/inngest/events";
import { prisma } from "@workspace/db";
import { decryptToken, encryptToken } from "./token-crypto";
import { JiraNotConnectedError, JiraReauthRequiredError } from "./jira-errors";
import { refreshAccessToken } from "./jira-client";
import { JiraRequestError } from "./jira-rest-client";

// Refresh slightly before the real expiry so a token isn't handed out moments
// before it dies mid-request.
const EXPIRY_SKEW_MS = 60_000;

type LockedRow = {
  id: string;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
};

function isFresh(expiresAt: Date | null): boolean {
  return !!expiresAt && expiresAt.getTime() - EXPIRY_SKEW_MS > Date.now();
}

/**
 * Atlassian answers a dead grant with a 4xx (`invalid_grant`,
 * `unauthorized_client`): the refresh token will never work again. A 5xx or a
 * network failure says nothing about the grant, so it must leave the
 * installation connected and be retried instead of asking the Organization to
 * reconnect a healthy Jira Installation.
 */
function isRefusedByAtlassian(error: unknown): boolean {
  return (
    error instanceof JiraRequestError &&
    error.status >= 400 &&
    error.status < 500
  );
}

/**
 * Returns a valid (decrypted) Jira access token for the organization, refreshing
 * lazily when the current one is expired.
 *
 * Atlassian rotates the refresh token on every refresh and invalidates the old
 * one, so two concurrent refreshes racing on the same installation would leave
 * one holding a dead refresh token — bricking the connection. The refresh path
 * therefore runs inside a transaction that takes a `FOR UPDATE` row lock and
 * re-checks expiry after acquiring it (double-check): the loser of the race sees
 * the token the winner just wrote and returns it instead of refreshing again.
 */
export async function getValidJiraAccessToken(
  organizationId: string,
): Promise<string> {
  const installation = await prisma.jiraInstallation.findUnique({
    where: { organizationId },
    select: { accessToken: true, tokenExpiresAt: true },
  });

  if (!installation) throw new JiraNotConnectedError();

  // Fast path: still valid, no lock needed.
  if (isFresh(installation.tokenExpiresAt)) {
    return decryptToken(installation.accessToken);
  }

  try {
    return await refreshUnderLock(organizationId);
  } catch (error) {
    // Emitted after the transaction has committed, so the handler reads the
    // already-flipped row. Notifying from here rather than from each caller means
    // no sync path can drop a revocation on the floor.
    if (error instanceof JiraReauthRequiredError) {
      await inngest.send(
        buildEvent(jiraOAuthRevokedEvent, {
          installationId: error.installationId,
        }),
      );
    }
    throw error;
  }
}

function refreshUnderLock(organizationId: string): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<LockedRow[]>`
      SELECT "id", "accessToken", "refreshToken", "tokenExpiresAt"
      FROM "jira_installation"
      WHERE "organizationId" = ${organizationId}
      FOR UPDATE
    `;
    const row = rows[0];
    if (!row) throw new JiraNotConnectedError();

    // Another request refreshed while we waited for the lock.
    if (isFresh(row.tokenExpiresAt)) {
      return decryptToken(row.accessToken);
    }

    if (!row.refreshToken) {
      await tx.jiraInstallation.update({
        where: { id: row.id },
        data: { healthState: "reconnect_required" },
      });
      throw new JiraReauthRequiredError(row.id);
    }

    // Decrypted outside the try: a key or payload problem is ours, not a
    // refusal from Atlassian, and must not flip the installation.
    const currentRefreshToken = decryptToken(row.refreshToken);

    let refreshed;
    try {
      refreshed = await refreshAccessToken(currentRefreshToken);
    } catch (error) {
      if (!isRefusedByAtlassian(error)) throw error;
      await tx.jiraInstallation.update({
        where: { id: row.id },
        data: { healthState: "reconnect_required" },
      });
      throw new JiraReauthRequiredError(row.id);
    }

    await tx.jiraInstallation.update({
      where: { id: row.id },
      data: {
        accessToken: encryptToken(refreshed.access_token),
        // Persist the rotated refresh token atomically; fall back to the existing
        // one only if Atlassian omitted it (should not happen with offline_access).
        refreshToken: refreshed.refresh_token
          ? encryptToken(refreshed.refresh_token)
          : row.refreshToken,
        tokenScope: refreshed.scope,
        tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
        healthState: "connected",
        // Recovery re-arms the notification: a later revocation must be able to
        // email the organization again.
        reconnectNotifiedAt: null,
      },
    });

    return refreshed.access_token;
  });
}
