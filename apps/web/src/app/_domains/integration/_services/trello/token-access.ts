import { inngest } from "@/server/inngest";
import { buildEvent, trelloOAuthRevokedEvent } from "@/server/inngest/events";
import { prisma } from "@workspace/db";
import { decryptToken, encryptToken } from "./token-crypto";
import {
  TrelloNotConnectedError,
  TrelloReauthRequiredError,
} from "./trello-errors";
import { refreshAccessToken } from "./trello-client";
import { TrelloRequestError } from "./trello-request-error";

// Refresh slightly before the real expiry so a token isn't handed out moments
// before it dies mid-request.
const EXPIRY_SKEW_MS = 60_000;

type LockedRow = {
  id: string;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
};

// No expiry means Atlassian issued a token that does not expire: only a refused
// call can tell it has died.
function isFresh(expiresAt: Date | null): boolean {
  return !expiresAt || expiresAt.getTime() - EXPIRY_SKEW_MS > Date.now();
}

/**
 * Atlassian answers a dead grant on the token endpoint with a 4xx
 * (`invalid_grant`, `unauthorized_client`). A 5xx or a network failure says
 * nothing about the grant, so it must leave the Installation connected and be
 * retried.
 */
function isRefusedByAtlassian(error: unknown): boolean {
  return (
    error instanceof TrelloRequestError &&
    error.status >= 400 &&
    error.status < 500
  );
}

// Trello sends no revocation webhook: a resource call answered 401 is how a
// revoked grant is detected. 403 is a permission on one board, not the grant.
function isRefusedByTrello(error: unknown): boolean {
  return error instanceof TrelloRequestError && error.status === 401;
}

async function notifyReauthRequired(installationId: string) {
  // Emitted after the row is flipped, so the handler reads it already flipped.
  // Notifying from here rather than from each caller means no sync path can
  // drop a revocation on the floor.
  await inngest.send(buildEvent(trelloOAuthRevokedEvent, { installationId }));
}

/**
 * Returns a valid (decrypted) Trello access token for the Organization,
 * refreshing lazily when the current one is expired.
 *
 * Atlassian may rotate the refresh token on every refresh and invalidate the
 * old one, so two concurrent refreshes would leave one holding a dead refresh
 * token. The refresh path therefore takes a `FOR UPDATE` row lock and re-checks
 * expiry after acquiring it: the loser of the race returns the token the winner
 * just wrote.
 */
export async function getValidTrelloAccessToken(
  organizationId: string,
): Promise<string> {
  const installation = await prisma.trelloInstallation.findUnique({
    where: { organizationId },
    select: { accessToken: true, tokenExpiresAt: true },
  });

  if (!installation) throw new TrelloNotConnectedError();

  if (isFresh(installation.tokenExpiresAt)) {
    return decryptToken(installation.accessToken);
  }

  try {
    return await refreshUnderLock(organizationId);
  } catch (error) {
    if (error instanceof TrelloReauthRequiredError) {
      await notifyReauthRequired(error.installationId);
    }
    throw error;
  }
}

/**
 * The single seam every Trello call goes through: hands `call` a valid token
 * and turns a 401 from Trello into Reconnect required. Any other failure is
 * rethrown untouched so the caller retries it.
 */
export async function withTrelloAccessToken<T>(
  organizationId: string,
  call: (accessToken: string) => Promise<T>,
): Promise<T> {
  const accessToken = await getValidTrelloAccessToken(organizationId);

  try {
    return await call(accessToken);
  } catch (error) {
    if (!isRefusedByTrello(error)) throw error;

    const installation = await prisma.trelloInstallation.update({
      where: { organizationId },
      data: { healthState: "reconnect_required" },
      select: { id: true },
    });
    await notifyReauthRequired(installation.id);
    throw new TrelloReauthRequiredError(installation.id);
  }
}

function refreshUnderLock(organizationId: string): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<LockedRow[]>`
      SELECT "id", "accessToken", "refreshToken", "tokenExpiresAt"
      FROM "trello_installation"
      WHERE "organizationId" = ${organizationId}
      FOR UPDATE
    `;
    const row = rows[0];
    if (!row) throw new TrelloNotConnectedError();

    // Another request refreshed while we waited for the lock.
    if (isFresh(row.tokenExpiresAt)) {
      return decryptToken(row.accessToken);
    }

    // An expired token with nothing to renew it is a dead grant, not an outage.
    if (!row.refreshToken) {
      await tx.trelloInstallation.update({
        where: { id: row.id },
        data: { healthState: "reconnect_required" },
      });
      throw new TrelloReauthRequiredError(row.id);
    }

    // Decrypted outside the try: a key or payload problem is ours, not a
    // refusal from Atlassian, and must not flip the Installation.
    const currentRefreshToken = decryptToken(row.refreshToken);

    let refreshed;
    try {
      refreshed = await refreshAccessToken(currentRefreshToken);
    } catch (error) {
      if (!isRefusedByAtlassian(error)) throw error;
      await tx.trelloInstallation.update({
        where: { id: row.id },
        data: { healthState: "reconnect_required" },
      });
      throw new TrelloReauthRequiredError(row.id);
    }

    await tx.trelloInstallation.update({
      where: { id: row.id },
      data: {
        accessToken: encryptToken(refreshed.access_token),
        // Keep the stored refresh token when Atlassian does not rotate it.
        refreshToken: refreshed.refresh_token
          ? encryptToken(refreshed.refresh_token)
          : row.refreshToken,
        tokenScope: refreshed.scope,
        tokenExpiresAt: refreshed.expires_in
          ? new Date(Date.now() + refreshed.expires_in * 1000)
          : null,
        healthState: "connected",
        // Recovery re-arms the notification for a later revocation.
        reconnectNotifiedAt: null,
      },
    });

    return refreshed.access_token;
  });
}
