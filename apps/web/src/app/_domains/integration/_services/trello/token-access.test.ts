/**
 * Drives the public interface of Trello token access with `fetch` and the
 * database client mocked. The branch under test is the one that decides
 * whether a failure means "the member revoked us" (flip the Installation to
 * Reconnect required and notify) or "Trello is having a bad day" (leave the
 * Installation alone and let the caller retry).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Read at module load by the Trello cipher and per call by the token endpoint,
// so they are stubbed before `token-access` is imported below.
vi.stubEnv("TRELLO_TOKEN_ENCRYPTION_KEY", "b".repeat(64));
vi.stubEnv("TRELLO_CLIENT_ID", "trello-client-id");
vi.stubEnv("TRELLO_CLIENT_SECRET", "trello-client-secret");

const installationUpdate = vi.fn();
const installationFindUnique = vi.fn();
const queryRaw = vi.fn();

type PrismaDouble = {
  trelloInstallation: {
    findUnique: typeof installationFindUnique;
    update: typeof installationUpdate;
  };
  $queryRaw: typeof queryRaw;
  $transaction: <T>(run: (tx: PrismaDouble) => Promise<T>) => Promise<T>;
};

const prismaDouble: PrismaDouble = {
  trelloInstallation: {
    findUnique: installationFindUnique,
    update: installationUpdate,
  },
  $queryRaw: queryRaw,
  $transaction: (run) => run(prismaDouble),
};

const inngestSend = vi.fn();

vi.mock("@workspace/db", () => ({ prisma: prismaDouble }));
vi.mock("@/server/inngest", () => ({ inngest: { send: inngestSend } }));

const { decryptToken, encryptToken } = await import("./token-crypto");
const { TrelloNotConnectedError, TrelloReauthRequiredError } =
  await import("./trello-errors");
const { TrelloRequestError } = await import("./trello-request-error");
const { getValidTrelloAccessToken, withTrelloAccessToken } =
  await import("./token-access");

const ORGANIZATION_ID = "organization_1";
const INSTALLATION_ID = "trello_installation_1";
const ACCESS_TOKEN = "access-token-in-store";
const REFRESH_TOKEN = "refresh-token-in-store";

const FRESH = new Date(Date.now() + 10 * 60_000);
const EXPIRED = new Date(Date.now() - 60_000);

const REVOKED_EVENT = {
  name: "trello/oauth.revoked",
  data: { installationId: INSTALLATION_ID },
};

/** The row `findUnique` reads on the fast path, and the one the lock returns. */
function seedInstallation(
  tokenExpiresAt: Date | null,
  refreshToken: string | null = REFRESH_TOKEN,
) {
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
      json: async (): Promise<unknown> => JSON.parse(body),
    }),
  );
}

const ROTATED_TOKENS = JSON.stringify({
  access_token: "next-access-token",
  refresh_token: "next-refresh-token",
  token_type: "Bearer",
  expires_in: 3600,
  scope: "read:board:trello",
});

/** The `data` of the one update that stored refreshed tokens. */
function storedTokens(): Record<string, unknown> {
  const [call] = installationUpdate.mock.calls as [
    [{ data: Record<string, unknown> }],
  ];
  return call[0].data;
}

describe("getValidTrelloAccessToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    atlassianAnswers(500, "unused");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("hands out the stored token without refreshing or locking while it is fresh", async () => {
    seedInstallation(FRESH);

    await expect(getValidTrelloAccessToken(ORGANIZATION_ID)).resolves.toBe(
      ACCESS_TOKEN,
    );
    expect(queryRaw).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("hands out a token Atlassian issued without an expiry as it is", async () => {
    seedInstallation(null);

    await expect(getValidTrelloAccessToken(ORGANIZATION_ID)).resolves.toBe(
      ACCESS_TOKEN,
    );
    expect(queryRaw).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reports an Organization with no Installation as not connected", async () => {
    installationFindUnique.mockResolvedValue(null);

    await expect(
      getValidTrelloAccessToken(ORGANIZATION_ID),
    ).rejects.toBeInstanceOf(TrelloNotConnectedError);
    expect(inngestSend).not.toHaveBeenCalled();
  });

  it("refreshes an expired token with the stored refresh token and stores the rotated pair", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    seedInstallation(new Date("2025-12-31T23:00:00.000Z"));
    atlassianAnswers(200, ROTATED_TOKENS);

    await expect(getValidTrelloAccessToken(ORGANIZATION_ID)).resolves.toBe(
      "next-access-token",
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toMatchObject({
      grant_type: "refresh_token",
      refresh_token: REFRESH_TOKEN,
    });

    expect(installationUpdate).toHaveBeenCalledTimes(1);
    const data = storedTokens();
    expect(decryptToken(data.accessToken as string)).toBe("next-access-token");
    expect(decryptToken(data.refreshToken as string)).toBe(
      "next-refresh-token",
    );
    expect(data).toMatchObject({
      tokenScope: "read:board:trello",
      tokenExpiresAt: new Date("2026-01-01T01:00:00.000Z"),
      healthState: "connected",
      reconnectNotifiedAt: null,
    });
    expect(inngestSend).not.toHaveBeenCalled();
  });

  it("keeps the stored refresh token when Atlassian does not rotate it", async () => {
    seedInstallation(EXPIRED);
    atlassianAnswers(
      200,
      JSON.stringify({
        access_token: "next-access-token",
        token_type: "Bearer",
        expires_in: 3600,
        scope: "read:board:trello",
      }),
    );

    await getValidTrelloAccessToken(ORGANIZATION_ID);

    expect(decryptToken(storedTokens().refreshToken as string)).toBe(
      REFRESH_TOKEN,
    );
  });

  it("returns the token the winner of the lock race just wrote, without a second refresh", async () => {
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

    await expect(getValidTrelloAccessToken(ORGANIZATION_ID)).resolves.toBe(
      "token-written-by-the-winner",
    );
    expect(fetch).not.toHaveBeenCalled();
    expect(installationUpdate).not.toHaveBeenCalled();
  });

  it("produces a single refresh for two concurrent callers", async () => {
    // A real row lock: the second transaction reads the row only after the
    // first has committed, and sees what it wrote.
    let row = {
      id: INSTALLATION_ID,
      accessToken: encryptToken(ACCESS_TOKEN),
      refreshToken: encryptToken(REFRESH_TOKEN) as string | null,
      tokenExpiresAt: EXPIRED,
    };
    installationFindUnique.mockResolvedValue({
      accessToken: row.accessToken,
      tokenExpiresAt: EXPIRED,
    });
    queryRaw.mockImplementation(async () => [row]);
    installationUpdate.mockImplementation(
      async ({ data }: { data: typeof row }) => {
        row = { ...row, ...data };
      },
    );
    let lock = Promise.resolve();
    const originalTransaction = prismaDouble.$transaction;
    prismaDouble.$transaction = (run) => {
      const result = lock.then(() => run(prismaDouble));
      lock = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    };
    atlassianAnswers(200, ROTATED_TOKENS);

    try {
      await expect(
        Promise.all([
          getValidTrelloAccessToken(ORGANIZATION_ID),
          getValidTrelloAccessToken(ORGANIZATION_ID),
        ]),
      ).resolves.toEqual(["next-access-token", "next-access-token"]);
    } finally {
      prismaDouble.$transaction = originalTransaction;
    }

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("asks for a reconnect and emits one event when Atlassian refuses the grant", async () => {
    seedInstallation(EXPIRED);
    atlassianAnswers(400, JSON.stringify({ error: "invalid_grant" }));

    await expect(
      getValidTrelloAccessToken(ORGANIZATION_ID),
    ).rejects.toBeInstanceOf(TrelloReauthRequiredError);
    expect(installationUpdate).toHaveBeenCalledWith({
      where: { id: INSTALLATION_ID },
      data: { healthState: "reconnect_required" },
    });
    expect(inngestSend).toHaveBeenCalledTimes(1);
    expect(inngestSend).toHaveBeenCalledWith(REVOKED_EVENT);
  });

  it("keeps the Installation connected when Atlassian is failing", async () => {
    seedInstallation(EXPIRED);
    atlassianAnswers(503, "service unavailable");

    const failure = await getValidTrelloAccessToken(ORGANIZATION_ID).catch(
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(TrelloRequestError);
    expect(failure).not.toBeInstanceOf(TrelloReauthRequiredError);
    expect(installationUpdate).not.toHaveBeenCalled();
    expect(inngestSend).not.toHaveBeenCalled();
  });

  it("keeps the Installation connected when the refresh call cannot reach Atlassian", async () => {
    seedInstallation(EXPIRED);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    );

    const failure = await getValidTrelloAccessToken(ORGANIZATION_ID).catch(
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(TypeError);
    expect(installationUpdate).not.toHaveBeenCalled();
    expect(inngestSend).not.toHaveBeenCalled();
  });

  it("asks for a reconnect when an expired token has no refresh token to renew it", async () => {
    seedInstallation(EXPIRED, null);

    await expect(
      getValidTrelloAccessToken(ORGANIZATION_ID),
    ).rejects.toBeInstanceOf(TrelloReauthRequiredError);
    expect(fetch).not.toHaveBeenCalled();
    expect(installationUpdate).toHaveBeenCalledWith({
      where: { id: INSTALLATION_ID },
      data: { healthState: "reconnect_required" },
    });
    expect(inngestSend).toHaveBeenCalledWith(REVOKED_EVENT);
  });
});

describe("withTrelloAccessToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedInstallation(FRESH);
    installationUpdate.mockResolvedValue({ id: INSTALLATION_ID });
  });

  it("hands the call a valid token and returns what it returns", async () => {
    const call = vi.fn().mockResolvedValue("board list");

    await expect(withTrelloAccessToken(ORGANIZATION_ID, call)).resolves.toBe(
      "board list",
    );
    expect(call).toHaveBeenCalledWith(ACCESS_TOKEN);
    expect(installationUpdate).not.toHaveBeenCalled();
  });

  it("asks for a reconnect and emits one event when Trello answers 401", async () => {
    const call = vi
      .fn()
      .mockRejectedValue(
        new TrelloRequestError(401, "invalid token", "/members/me/boards"),
      );

    await expect(
      withTrelloAccessToken(ORGANIZATION_ID, call),
    ).rejects.toBeInstanceOf(TrelloReauthRequiredError);
    expect(installationUpdate).toHaveBeenCalledWith({
      where: { organizationId: ORGANIZATION_ID },
      data: { healthState: "reconnect_required" },
      select: { id: true },
    });
    expect(inngestSend).toHaveBeenCalledTimes(1);
    expect(inngestSend).toHaveBeenCalledWith(REVOKED_EVENT);
  });

  it.each([
    ["Trello is failing", new TrelloRequestError(503, "down", "/cards")],
    [
      "one board is not readable",
      new TrelloRequestError(403, "forbidden", "/boards/1"),
    ],
    ["Trello is unreachable", new TypeError("fetch failed")],
  ])("keeps the Installation connected when %s", async (_, error) => {
    const call = vi.fn().mockRejectedValue(error);

    await expect(withTrelloAccessToken(ORGANIZATION_ID, call)).rejects.toBe(
      error,
    );
    expect(installationUpdate).not.toHaveBeenCalled();
    expect(inngestSend).not.toHaveBeenCalled();
  });
});
