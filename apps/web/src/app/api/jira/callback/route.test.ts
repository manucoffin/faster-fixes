/**
 * Characterization tests: they pin what a User coming back from the Atlassian
 * consent screen observes today (status, redirect target, error query
 * parameter, state cookie, and the webhook refresh the connection asks for),
 * so moving the Member check and the Installation upsert behind services can
 * be proven behaviour-preserving. They assert on responses only, never on how
 * the handler reaches them.
 *
 * A test here that has to change is a broken contract: the callback URL is
 * registered in the OAuth app at Atlassian and its redirect targets are what
 * the integrations screen reads back to tell the User what happened.
 */

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  getAccessibleResources,
  JiraTokenResponse,
} from "@/app/_domains/integration/_services/jira/jira-client";

const BASE_URL = "https://app.test";
const REDIRECT_URI = `${BASE_URL}/api/jira/callback`;
const USER_ID = "user_1";
const ORGANIZATION_ID = "org_1";
const MEMBER_ID = "member_1";
const INSTALLATION_ID = "jira_installation_1";
const STATE = "state_value";
const CODE = "oauth_code";

const ONE_SITE = [
  {
    id: "cloud_1",
    url: "https://acme.atlassian.net",
    name: "Acme",
    scopes: [],
  },
];

const TWO_SITES = [
  ...ONE_SITE,
  {
    id: "cloud_2",
    url: "https://acme-staging.atlassian.net",
    name: "Acme Staging",
    scopes: [],
  },
];

const callbackPrisma = {
  member: { findFirst: vi.fn() },
  jiraInstallation: { upsert: vi.fn() },
};

const getSessionDouble = vi.fn();
const getFullOrganizationDouble = vi.fn();
// Partial: one case replays an Atlassian answer that carries no expiry.
const exchangeOAuthCodeDouble =
  vi.fn<
    (code: string, redirectUri: string) => Promise<Partial<JiraTokenResponse>>
  >();
const getAccessibleResourcesDouble = vi.fn<typeof getAccessibleResources>();
const inngestSendDouble = vi.fn<(event: unknown) => Promise<void>>();

vi.mock("@workspace/db", () => ({ prisma: callbackPrisma }));

vi.mock("@/server/auth", () => ({
  auth: {
    api: {
      getSession: getSessionDouble,
      getFullOrganization: getFullOrganizationDouble,
    },
  },
}));

vi.mock("@/server/inngest", () => ({
  inngest: { send: inngestSendDouble },
}));

vi.mock("@/app/_domains/integration/_services/jira/jira-client", () => ({
  exchangeOAuthCode: exchangeOAuthCodeDouble,
  getAccessibleResources: getAccessibleResourcesDouble,
  getJiraOAuthRedirectUri: () => REDIRECT_URI,
}));

vi.mock("@/app/_domains/integration/_services/jira/token-crypto", () => ({
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
  if (cookieState) headers.set("cookie", `jira_oauth_state=${cookieState}`);

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
  callbackPrisma.jiraInstallation.upsert.mockResolvedValue({
    id: INSTALLATION_ID,
  });
  exchangeOAuthCodeDouble.mockResolvedValue({
    access_token: "access_token_value",
    refresh_token: "refresh_token_value",
    token_type: "Bearer",
    expires_in: 3600,
    scope: "read:jira-work",
  });
  getAccessibleResourcesDouble.mockResolvedValue(ONE_SITE);
  inngestSendDouble.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("GET /api/jira/callback", () => {
  it("passes a refusal from Atlassian through as an error query parameter", async () => {
    const response = await GET(
      callbackRequest({ error: "access_denied", code: null, state: null }),
    );

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=jira_oauth_access_denied`,
    );
    expect(getSessionDouble).not.toHaveBeenCalled();
  });

  it("refuses a callback that carries no code or no state", async () => {
    const response = await GET(callbackRequest({ code: null }));

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=jira_missing_code_or_state`,
    );
  });

  it("refuses a state that does not match the cookie", async () => {
    const response = await GET(callbackRequest({ cookieState: "other_state" }));

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=jira_state_mismatch`,
    );
    expect(getSessionDouble).not.toHaveBeenCalled();
  });

  it("refuses a callback with no state cookie at all", async () => {
    const response = await GET(callbackRequest({ cookieState: null }));

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=jira_state_mismatch`,
    );
  });

  it("refuses a signed out caller", async () => {
    getSessionDouble.mockResolvedValue(null);

    const response = await GET(callbackRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=not_authenticated`,
    );
    expect(callbackPrisma.jiraInstallation.upsert).not.toHaveBeenCalled();
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
    expect(callbackPrisma.jiraInstallation.upsert).not.toHaveBeenCalled();
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
      `${BASE_URL}/integrations?error=jira_token_exchange_failed`,
    );
    expect(callbackPrisma.jiraInstallation.upsert).not.toHaveBeenCalled();
  });

  it("exchanges the code against the registered redirect uri", async () => {
    await GET(callbackRequest());

    expect(exchangeOAuthCodeDouble).toHaveBeenCalledWith(CODE, REDIRECT_URI);
  });

  it("refuses when the accessible sites cannot be read", async () => {
    getAccessibleResourcesDouble.mockRejectedValue(new Error("unreachable"));

    const response = await GET(callbackRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=jira_sites_fetch_failed`,
    );
    expect(callbackPrisma.jiraInstallation.upsert).not.toHaveBeenCalled();
  });

  it("refuses a grant that gives access to no site at all", async () => {
    getAccessibleResourcesDouble.mockResolvedValue([]);

    const response = await GET(callbackRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=jira_no_sites`,
    );
    expect(callbackPrisma.jiraInstallation.upsert).not.toHaveBeenCalled();
  });

  it("records the only accessible site as connected and lands back on the integrations screen", async () => {
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const response = await GET(callbackRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(`${BASE_URL}/integrations?jira=connected`);

    const installationColumns = {
      cloudId: "cloud_1",
      siteUrl: "https://acme.atlassian.net",
      siteName: "Acme",
      accessToken: "encrypted:access_token_value",
      refreshToken: "encrypted:refresh_token_value",
      tokenScope: "read:jira-work",
      tokenExpiresAt: new Date("2026-01-01T01:00:00.000Z"),
      healthState: "connected",
      reconnectNotifiedAt: null,
      installedById: MEMBER_ID,
    };

    expect(callbackPrisma.jiraInstallation.upsert).toHaveBeenCalledWith({
      where: { organizationId: ORGANIZATION_ID },
      update: installationColumns,
      create: { organizationId: ORGANIZATION_ID, ...installationColumns },
      select: { id: true },
    });
  });

  it("asks for a webhook refresh once the connection is live", async () => {
    await GET(callbackRequest());

    expect(inngestSendDouble).toHaveBeenCalledWith({
      name: "jira/webhooks.refresh-requested",
      data: { installationId: INSTALLATION_ID },
    });
  });

  it("stores the first of several sites provisionally and routes to the site picker", async () => {
    getAccessibleResourcesDouble.mockResolvedValue(TWO_SITES);

    const response = await GET(callbackRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?jira=select_site`,
    );
    expect(callbackPrisma.jiraInstallation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          cloudId: "cloud_1",
          healthState: "pending_site_selection",
        }),
      }),
    );
    expect(inngestSendDouble).not.toHaveBeenCalled();
  });

  it("stores no refresh token and no expiry when Atlassian returns neither", async () => {
    exchangeOAuthCodeDouble.mockResolvedValue({
      access_token: "access_token_value",
      token_type: "Bearer",
      scope: "read:jira-work",
    });

    await GET(callbackRequest());

    expect(callbackPrisma.jiraInstallation.upsert).toHaveBeenCalledWith(
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

    expect(response.cookies.get("jira_oauth_state")?.value).toBe("");
  });
});
