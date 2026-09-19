/**
 * Characterization tests: they pin what a User coming back from the Linear
 * consent screen observes today (status, redirect target, error query
 * parameter, state cookie), so moving the Member check, the Linear
 * organization read and the Installation upsert behind services can be proven
 * behaviour-preserving. They assert on responses only, never on how the handler
 * reaches them.
 *
 * A test here that has to change is a broken contract: the callback URL is
 * registered in the OAuth app at Linear and its redirect targets are what the
 * integrations screen reads back to tell the User what happened.
 */

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const BASE_URL = "https://app.test";
const REDIRECT_URI = `${BASE_URL}/api/linear/callback`;
const USER_ID = "user_1";
const ORGANIZATION_ID = "org_1";
const MEMBER_ID = "member_1";
const STATE = "state_value";
const CODE = "oauth_code";

const callbackPrisma = {
  member: { findFirst: vi.fn() },
  linearInstallation: { upsert: vi.fn() },
};

const getSessionDouble = vi.fn();
const getFullOrganizationDouble = vi.fn();
const exchangeOAuthCodeDouble = vi.fn();
const linearOrganizationDouble = vi.fn();

vi.mock("@workspace/db", () => ({ prisma: callbackPrisma }));

vi.mock("@/server/auth", () => ({
  auth: {
    api: {
      getSession: getSessionDouble,
      getFullOrganization: getFullOrganizationDouble,
    },
  },
}));

vi.mock("@/app/_domains/integration/_services/linear/linear-client", () => ({
  exchangeOAuthCode: (...args: unknown[]) => exchangeOAuthCodeDouble(...args),
  getLinearClient: () => ({
    get organization() {
      return linearOrganizationDouble();
    },
  }),
  getLinearOAuthRedirectUri: () => REDIRECT_URI,
}));

vi.mock("@/app/_domains/integration/_services/linear/token-crypto", () => ({
  encryptToken: (plain: string) => `encrypted:${plain}`,
}));

const { GET } = await import("./route");

type CallbackRequestInit = {
  code?: string | null;
  state?: string | null;
  error?: string | null;
  cookieState?: string | null;
};

function callbackRequest(init: CallbackRequestInit = {}) {
  const {
    code = CODE,
    state = STATE,
    error = null,
    cookieState = STATE,
  } = init;

  const url = new URL(REDIRECT_URI);
  if (code) url.searchParams.set("code", code);
  if (state) url.searchParams.set("state", state);
  if (error) url.searchParams.set("error", error);

  const headers = new Headers();
  if (cookieState) headers.set("cookie", `linear_oauth_state=${cookieState}`);

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
  callbackPrisma.linearInstallation.upsert.mockResolvedValue({});
  exchangeOAuthCodeDouble.mockResolvedValue({
    access_token: "access_token_value",
    refresh_token: "refresh_token_value",
    token_type: "Bearer",
    expires_in: 3600,
    scope: "read,write",
  });
  linearOrganizationDouble.mockResolvedValue({
    id: "linear_org_1",
    name: "Acme",
    urlKey: "acme",
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("GET /api/linear/callback", () => {
  it("passes a refusal from Linear through as an error query parameter", async () => {
    const response = await GET(
      callbackRequest({ error: "access_denied", code: null, state: null }),
    );

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=linear_oauth_access_denied`,
    );
    expect(getSessionDouble).not.toHaveBeenCalled();
  });

  it("refuses a callback that carries no code or no state", async () => {
    const response = await GET(callbackRequest({ code: null }));

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=linear_missing_code_or_state`,
    );
  });

  it("refuses a state that does not match the cookie", async () => {
    const response = await GET(callbackRequest({ cookieState: "other_state" }));

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=linear_state_mismatch`,
    );
    expect(getSessionDouble).not.toHaveBeenCalled();
  });

  it("refuses a callback with no state cookie at all", async () => {
    const response = await GET(callbackRequest({ cookieState: null }));

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=linear_state_mismatch`,
    );
  });

  it("refuses a signed out caller", async () => {
    getSessionDouble.mockResolvedValue(null);

    const response = await GET(callbackRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=not_authenticated`,
    );
    expect(callbackPrisma.linearInstallation.upsert).not.toHaveBeenCalled();
  });

  it("refuses a caller with no active Organization", async () => {
    getFullOrganizationDouble.mockResolvedValue(null);

    const response = await GET(callbackRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=no_active_org`,
    );
    expect(callbackPrisma.member.findFirst).not.toHaveBeenCalled();
  });

  it("refuses a caller who is not an owner or admin Member", async () => {
    callbackPrisma.member.findFirst.mockResolvedValue(null);

    const response = await GET(callbackRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=insufficient_role`,
    );
    expect(exchangeOAuthCodeDouble).not.toHaveBeenCalled();
    expect(callbackPrisma.linearInstallation.upsert).not.toHaveBeenCalled();
  });

  it("looks the caller up among the owners and admins of the active Organization", async () => {
    await GET(callbackRequest());

    expect(callbackPrisma.member.findFirst).toHaveBeenCalledWith({
      where: {
        organizationId: ORGANIZATION_ID,
        userId: USER_ID,
        role: { in: ["owner", "admin"] },
      },
    });
  });

  it("refuses when the code cannot be exchanged for a token", async () => {
    exchangeOAuthCodeDouble.mockRejectedValue(new Error("bad code"));

    const response = await GET(callbackRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=linear_token_exchange_failed`,
    );
    expect(callbackPrisma.linearInstallation.upsert).not.toHaveBeenCalled();
  });

  it("refuses when the Linear organization cannot be read", async () => {
    linearOrganizationDouble.mockRejectedValue(new Error("unreachable"));

    const response = await GET(callbackRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=linear_org_fetch_failed`,
    );
    expect(callbackPrisma.linearInstallation.upsert).not.toHaveBeenCalled();
  });

  it("records the Installation and lands back on the integrations screen", async () => {
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const response = await GET(callbackRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?linear=connected`,
    );

    const installationColumns = {
      linearOrgId: "linear_org_1",
      linearOrgName: "Acme",
      linearOrgUrlKey: "acme",
      accessToken: "encrypted:access_token_value",
      refreshToken: "encrypted:refresh_token_value",
      tokenScope: "read,write",
      tokenExpiresAt: new Date("2026-01-01T01:00:00.000Z"),
      installedById: MEMBER_ID,
    };

    expect(callbackPrisma.linearInstallation.upsert).toHaveBeenCalledWith({
      where: { organizationId: ORGANIZATION_ID },
      update: installationColumns,
      create: { organizationId: ORGANIZATION_ID, ...installationColumns },
    });
  });

  it("exchanges the code against the registered redirect uri", async () => {
    await GET(callbackRequest());

    expect(exchangeOAuthCodeDouble).toHaveBeenCalledWith(CODE, REDIRECT_URI);
  });

  it("stores no refresh token and no expiry when Linear returns neither", async () => {
    exchangeOAuthCodeDouble.mockResolvedValue({
      access_token: "access_token_value",
      token_type: "Bearer",
      scope: "read,write",
    });

    await GET(callbackRequest());

    expect(callbackPrisma.linearInstallation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          refreshToken: null,
          tokenExpiresAt: null,
        }),
      }),
    );
  });

  it("clears the state cookie once the Installation is recorded", async () => {
    const response = await GET(callbackRequest());

    expect(response.cookies.get("linear_oauth_state")?.value).toBe("");
  });
});
