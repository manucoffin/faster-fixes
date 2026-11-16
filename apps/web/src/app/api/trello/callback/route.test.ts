/**
 * Contract tests: they pin what a User coming back from Trello's consent
 * screen observes (status, redirect target, query parameter, consent cookies)
 * and the Installation row written. They assert on responses and rows only,
 * never on how the handler reaches them.
 *
 * A test here that has to change is a broken contract: the callback URL is
 * registered in the OAuth client at Atlassian and its redirect targets are
 * what the integrations page reads back to tell the User what happened.
 */

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  getAuthorizedMember,
  TrelloTokenResponse,
} from "@/app/_domains/integration/_services/trello/trello-client";

const BASE_URL = "https://app.test";
const REDIRECT_URI = `${BASE_URL}/api/trello/callback`;
const USER_ID = "user_1";
const ORGANIZATION_ID = "org_1";
const MEMBER_ID = "member_1";
const STATE = "state_value";
const VERIFIER = "verifier_value";
const CODE = "oauth_code";

const callbackPrisma = {
  member: { findFirst: vi.fn() },
  trelloInstallation: { upsert: vi.fn() },
};

const getSessionDouble = vi.fn();
const getFullOrganizationDouble = vi.fn();
// Partial: one case replays an Atlassian answer that carries no expiry.
const exchangeOAuthCodeDouble =
  vi.fn<
    (input: {
      code: string;
      redirectUri: string;
      codeVerifier: string;
    }) => Promise<Partial<TrelloTokenResponse>>
  >();
const getAuthorizedMemberDouble = vi.fn<typeof getAuthorizedMember>();

vi.mock("@workspace/db", () => ({ prisma: callbackPrisma }));

vi.mock("@/server/auth", () => ({
  auth: {
    api: {
      getSession: getSessionDouble,
      getFullOrganization: getFullOrganizationDouble,
    },
  },
}));

vi.mock("@/app/_domains/integration/_services/trello/trello-client", () => ({
  exchangeOAuthCode: exchangeOAuthCodeDouble,
  getAuthorizedMember: getAuthorizedMemberDouble,
  getTrelloOAuthRedirectUri: () => REDIRECT_URI,
}));

vi.mock("@/app/_domains/integration/_services/trello/token-crypto", () => ({
  encryptToken: (plain: string) => `encrypted:${plain}`,
}));

const { GET } = await import("./route");

type CallbackRequestInit = {
  code?: string | null;
  state?: string | null;
  error?: string | null;
  cookieState?: string | null;
  cookieVerifier?: string | null;
};

function callbackRequest(init: CallbackRequestInit = {}) {
  const {
    code = CODE,
    state = STATE,
    error = null,
    cookieState = STATE,
    cookieVerifier = VERIFIER,
  } = init;

  const url = new URL(REDIRECT_URI);
  if (code) url.searchParams.set("code", code);
  if (state) url.searchParams.set("state", state);
  if (error) url.searchParams.set("error", error);

  const cookies = [
    cookieState ? `trello_oauth_state=${cookieState}` : null,
    cookieVerifier ? `trello_oauth_verifier=${cookieVerifier}` : null,
  ].filter(Boolean);
  const headers = new Headers();
  if (cookies.length > 0) headers.set("cookie", cookies.join("; "));

  return new NextRequest(url, { method: "GET", headers });
}

function location(response: Response) {
  return response.headers.get("location");
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("BETTER_AUTH_URL", BASE_URL);
  getSessionDouble.mockResolvedValue({ user: { id: USER_ID } });
  getFullOrganizationDouble.mockResolvedValue({ id: ORGANIZATION_ID });
  callbackPrisma.member.findFirst.mockResolvedValue({ id: MEMBER_ID });
  callbackPrisma.trelloInstallation.upsert.mockResolvedValue({
    id: "trello_installation_1",
  });
  exchangeOAuthCodeDouble.mockResolvedValue({
    access_token: "access_token_value",
    refresh_token: "refresh_token_value",
    token_type: "Bearer",
    expires_in: 3600,
    scope: "read:board:trello",
  });
  getAuthorizedMemberDouble.mockResolvedValue({
    id: "trello_member_1",
    fullName: "Acme Bot",
    username: "acmebot",
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("GET /api/trello/callback", () => {
  it("tells a User who cancelled consent that nothing was connected", async () => {
    const response = await GET(
      callbackRequest({ error: "access_denied", code: null }),
    );

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?trello=cancelled`,
    );
    expect(response.cookies.get("trello_oauth_state")?.value).toBe("");
    expect(response.cookies.get("trello_oauth_verifier")?.value).toBe("");
    expect(getSessionDouble).not.toHaveBeenCalled();
    expect(callbackPrisma.trelloInstallation.upsert).not.toHaveBeenCalled();
  });

  it("passes any other refusal from Atlassian through as an error query parameter", async () => {
    const response = await GET(
      callbackRequest({ error: "server_error", code: null, state: null }),
    );

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=trello_oauth_server_error`,
    );
    expect(callbackPrisma.trelloInstallation.upsert).not.toHaveBeenCalled();
  });

  it("refuses a callback that carries no code or no state", async () => {
    const response = await GET(callbackRequest({ code: null }));

    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=trello_missing_code_or_state`,
    );
  });

  it("refuses a state that does not match the cookie and stores nothing", async () => {
    const response = await GET(callbackRequest({ cookieState: "other_state" }));

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=trello_state_mismatch`,
    );
    expect(getSessionDouble).not.toHaveBeenCalled();
    expect(exchangeOAuthCodeDouble).not.toHaveBeenCalled();
    expect(callbackPrisma.trelloInstallation.upsert).not.toHaveBeenCalled();
  });

  it("refuses a callback with no state cookie at all", async () => {
    const response = await GET(callbackRequest({ cookieState: null }));

    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=trello_state_mismatch`,
    );
  });

  it("refuses a callback with no PKCE verifier cookie", async () => {
    const response = await GET(callbackRequest({ cookieVerifier: null }));

    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=trello_state_mismatch`,
    );
    expect(exchangeOAuthCodeDouble).not.toHaveBeenCalled();
  });

  it("refuses a signed out caller", async () => {
    getSessionDouble.mockResolvedValue(null);

    const response = await GET(callbackRequest());

    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=not_authenticated`,
    );
    expect(callbackPrisma.trelloInstallation.upsert).not.toHaveBeenCalled();
  });

  it("refuses a caller with no active Organization", async () => {
    getFullOrganizationDouble.mockResolvedValue(null);

    const response = await GET(callbackRequest());

    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=no_active_org`,
    );
  });

  it("refuses a caller who is not an owner or admin Member", async () => {
    callbackPrisma.member.findFirst.mockResolvedValue(null);

    const response = await GET(callbackRequest());

    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=insufficient_role`,
    );
    expect(callbackPrisma.member.findFirst).toHaveBeenCalledWith({
      where: {
        organizationId: ORGANIZATION_ID,
        userId: USER_ID,
        role: { in: ["owner", "admin"] },
      },
    });
    expect(exchangeOAuthCodeDouble).not.toHaveBeenCalled();
  });

  it("exchanges the code with the registered redirect uri and the PKCE verifier", async () => {
    await GET(callbackRequest());

    expect(exchangeOAuthCodeDouble).toHaveBeenCalledWith({
      code: CODE,
      redirectUri: REDIRECT_URI,
      codeVerifier: VERIFIER,
    });
    expect(getAuthorizedMemberDouble).toHaveBeenCalledWith(
      "access_token_value",
    );
  });

  it("refuses when the code cannot be exchanged for a token", async () => {
    exchangeOAuthCodeDouble.mockRejectedValue(new Error("bad code"));

    const response = await GET(callbackRequest());

    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=trello_token_exchange_failed`,
    );
    expect(callbackPrisma.trelloInstallation.upsert).not.toHaveBeenCalled();
  });

  it("refuses when the authorized member cannot be read", async () => {
    getAuthorizedMemberDouble.mockRejectedValue(new Error("unreachable"));

    const response = await GET(callbackRequest());

    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=trello_member_fetch_failed`,
    );
    expect(callbackPrisma.trelloInstallation.upsert).not.toHaveBeenCalled();
  });

  it("records the Installation as connected and lands back on the integrations page", async () => {
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const response = await GET(callbackRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?trello=connected`,
    );

    const installationColumns = {
      trelloMemberId: "trello_member_1",
      memberDisplayName: "Acme Bot",
      accessToken: "encrypted:access_token_value",
      refreshToken: "encrypted:refresh_token_value",
      tokenScope: "read:board:trello",
      tokenExpiresAt: new Date("2026-01-01T01:00:00.000Z"),
      healthState: "connected",
      reconnectNotifiedAt: null,
      installedById: MEMBER_ID,
    };

    expect(callbackPrisma.trelloInstallation.upsert).toHaveBeenCalledWith({
      where: { organizationId: ORGANIZATION_ID },
      update: installationColumns,
      create: { organizationId: ORGANIZATION_ID, ...installationColumns },
      select: { id: true },
    });
  });

  it("names the member by username when Trello has no full name for them", async () => {
    getAuthorizedMemberDouble.mockResolvedValue({
      id: "trello_member_1",
      fullName: "",
      username: "acmebot",
    });

    await GET(callbackRequest());

    expect(callbackPrisma.trelloInstallation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ memberDisplayName: "acmebot" }),
      }),
    );
  });

  it("stores no refresh token and no expiry when Atlassian returns neither", async () => {
    exchangeOAuthCodeDouble.mockResolvedValue({
      access_token: "access_token_value",
      token_type: "Bearer",
      scope: "read:board:trello",
    });

    await GET(callbackRequest());

    expect(callbackPrisma.trelloInstallation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          refreshToken: null,
          tokenExpiresAt: null,
        }),
      }),
    );
  });

  it("re-authorizing an Installation in Reconnect required clears it in place", async () => {
    // The double has no delete: the Installation row, and so every Project link
    // and Issue link hanging off it, must be updated rather than replaced.
    const response = await GET(callbackRequest());

    expect(location(response)).toBe(
      `${BASE_URL}/integrations?trello=connected`,
    );
    expect(callbackPrisma.trelloInstallation.upsert).toHaveBeenCalledTimes(1);
    expect(callbackPrisma.trelloInstallation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: ORGANIZATION_ID },
        update: expect.objectContaining({
          accessToken: "encrypted:access_token_value",
          healthState: "connected",
          reconnectNotifiedAt: null,
        }),
      }),
    );
  });

  it("clears both consent cookies once the Installation is recorded", async () => {
    const response = await GET(callbackRequest());

    expect(response.cookies.get("trello_oauth_state")?.value).toBe("");
    expect(response.cookies.get("trello_oauth_verifier")?.value).toBe("");
  });
});
