/**
 * Drives the public interface of Jira token access with `fetch` and the
 * database client mocked. The branch under test is the one that decides
 * whether a failed refresh means "the User revoked us" (flip the Installation
 * to Reconnect required and notify once) or "Atlassian is having a bad day"
 * (leave the Installation alone and let the caller retry).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Read at module load by the Jira cipher and per call by the token endpoint, so
// they are stubbed before `token-access` is imported below.
vi.stubEnv("JIRA_TOKEN_ENCRYPTION_KEY", "a".repeat(64));
vi.stubEnv("JIRA_CLIENT_ID", "jira-client-id");
vi.stubEnv("JIRA_CLIENT_SECRET", "jira-client-secret");

const installationUpdate = vi.fn();
const installationFindUnique = vi.fn();
const queryRaw = vi.fn();

type PrismaDouble = {
  jiraInstallation: {
    findUnique: typeof installationFindUnique;
    update: typeof installationUpdate;
  };
  $queryRaw: typeof queryRaw;
  $transaction: <T>(run: (tx: PrismaDouble) => Promise<T>) => Promise<T>;
};

const prismaDouble: PrismaDouble = {
  jiraInstallation: {
    findUnique: installationFindUnique,
    update: installationUpdate,
  },
  $queryRaw: queryRaw,
  $transaction: (run) => run(prismaDouble),
};

const inngestSend = vi.fn();

vi.mock("@workspace/db", () => ({ prisma: prismaDouble }));
vi.mock("@/server/inngest", () => ({ inngest: { send: inngestSend } }));

const { encryptToken } = await import("./crypto");
const {
  getValidJiraAccessToken,
  JiraNotConnectedError,
  JiraReauthRequiredError,
} = await import("./token-access");

const ORGANIZATION_ID = "organization_1";
const INSTALLATION_ID = "jira_installation_1";
const ACCESS_TOKEN = "access-token-in-store";
const REFRESH_TOKEN = "refresh-token-in-store";

const FRESH = new Date(Date.now() + 10 * 60_000);
const EXPIRED = new Date(Date.now() - 60_000);

/** The row `findUnique` reads on the fast path, and the one the lock returns. */
function seedInstallation(tokenExpiresAt: Date, refreshToken = REFRESH_TOKEN) {
  installationFindUnique.mockResolvedValue({
    accessToken: encryptToken(ACCESS_TOKEN),
    tokenExpiresAt,
  });
  queryRaw.mockResolvedValue([
    {
      id: INSTALLATION_ID,
      accessToken: encryptToken(ACCESS_TOKEN),
      refreshToken: refreshToken ? encryptToken(refreshToken) : null,
      tokenExpiresAt,
    },
  ]);
}

function atlassianAnswers(status: number, body = "") {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      text: async () => body,
      json: async () => JSON.parse(body),
    }),
  );
}

describe("getValidJiraAccessToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    atlassianAnswers(500, "unused");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hands out the stored token without refreshing while it is fresh", async () => {
    seedInstallation(FRESH);

    await expect(getValidJiraAccessToken(ORGANIZATION_ID)).resolves.toBe(
      ACCESS_TOKEN,
    );
    expect(queryRaw).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reports an organization with no installation as not connected", async () => {
    installationFindUnique.mockResolvedValue(null);

    await expect(
      getValidJiraAccessToken(ORGANIZATION_ID),
    ).rejects.toBeInstanceOf(JiraNotConnectedError);
    expect(inngestSend).not.toHaveBeenCalled();
  });

  it("stores the rotated token when Atlassian refreshes it", async () => {
    seedInstallation(EXPIRED);
    atlassianAnswers(
      200,
      JSON.stringify({
        access_token: "next-access-token",
        refresh_token: "next-refresh-token",
        token_type: "Bearer",
        expires_in: 3600,
        scope: "read:jira-work",
      }),
    );

    await expect(getValidJiraAccessToken(ORGANIZATION_ID)).resolves.toBe(
      "next-access-token",
    );
    expect(installationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: INSTALLATION_ID },
        data: expect.objectContaining({
          healthState: "connected",
          reconnectNotifiedAt: null,
        }),
      }),
    );
    expect(inngestSend).not.toHaveBeenCalled();
  });

  it("asks for a reconnect and notifies once when Atlassian refuses the grant", async () => {
    seedInstallation(EXPIRED);
    atlassianAnswers(400, JSON.stringify({ error: "invalid_grant" }));

    await expect(
      getValidJiraAccessToken(ORGANIZATION_ID),
    ).rejects.toBeInstanceOf(JiraReauthRequiredError);
    expect(installationUpdate).toHaveBeenCalledWith({
      where: { id: INSTALLATION_ID },
      data: { healthState: "reconnect_required" },
    });
    expect(inngestSend).toHaveBeenCalledWith({
      name: "jira/oauth.revoked",
      data: { installationId: INSTALLATION_ID },
    });
  });

  it("keeps the installation connected when Atlassian is failing", async () => {
    seedInstallation(EXPIRED);
    atlassianAnswers(503, "service unavailable");

    const failure = await getValidJiraAccessToken(ORGANIZATION_ID).catch(
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(Error);
    expect(failure).not.toBeInstanceOf(JiraReauthRequiredError);
    expect(installationUpdate).not.toHaveBeenCalled();
    expect(inngestSend).not.toHaveBeenCalled();
  });

  it("keeps the installation connected when the refresh call cannot reach Atlassian", async () => {
    seedInstallation(EXPIRED);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    );

    const failure = await getValidJiraAccessToken(ORGANIZATION_ID).catch(
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(TypeError);
    expect(installationUpdate).not.toHaveBeenCalled();
    expect(inngestSend).not.toHaveBeenCalled();
  });

  it("asks for a reconnect when the installation has no refresh token left", async () => {
    seedInstallation(EXPIRED, "");

    await expect(
      getValidJiraAccessToken(ORGANIZATION_ID),
    ).rejects.toBeInstanceOf(JiraReauthRequiredError);
    expect(installationUpdate).toHaveBeenCalledWith({
      where: { id: INSTALLATION_ID },
      data: { healthState: "reconnect_required" },
    });
    expect(inngestSend).toHaveBeenCalledTimes(1);
  });

  it("returns the token the winner of the lock race just wrote", async () => {
    installationFindUnique.mockResolvedValue({
      accessToken: encryptToken(ACCESS_TOKEN),
      tokenExpiresAt: EXPIRED,
    });
    queryRaw.mockResolvedValue([
      {
        id: INSTALLATION_ID,
        accessToken: encryptToken("token-written-by-the-winner"),
        refreshToken: encryptToken(REFRESH_TOKEN),
        tokenExpiresAt: FRESH,
      },
    ]);

    await expect(getValidJiraAccessToken(ORGANIZATION_ID)).resolves.toBe(
      "token-written-by-the-winner",
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});
