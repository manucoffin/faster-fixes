/**
 * Characterization tests: they pin what a User coming back from the Slack
 * consent screen observes today (status, redirect target, query parameter,
 * state cookie) and the Installation row the connection records, so moving the
 * Member check and the Installation upsert behind services can be proven
 * behaviour-preserving. They assert on responses only, never on how the
 * handler reaches them.
 *
 * A test here that has to change is a broken contract: the callback URL is
 * registered in the Slack app and its redirect targets are what the
 * integrations screen reads back to tell the User what happened. Slack answers
 * every refusal with the same `?slack=error`, which is why so many cases below
 * assert the same target: telling them apart is out of scope here.
 */

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { exchangeOAuthCode } from "@/app/_domains/integration/_services/slack/slack-client";

const BASE_URL = "https://app.test";
const REDIRECT_URI = `${BASE_URL}/api/slack/callback`;
const USER_ID = "user_1";
const ORGANIZATION_ID = "org_1";
const MEMBER_ID = "member_1";
const STATE = "state_value";
const CODE = "oauth_code";

const INSTALLATION = {
  botToken: "bot_token_value",
  botUserId: "bot_user_1",
  scope: "chat:write,channels:read",
  teamId: "team_1",
  teamName: "Acme",
};

const callbackPrisma = {
  member: { findFirst: vi.fn() },
  slackInstallation: { upsert: vi.fn() },
};

const getSessionDouble = vi.fn();
const getFullOrganizationDouble = vi.fn();
const exchangeOAuthCodeDouble = vi.fn<typeof exchangeOAuthCode>();

vi.mock("@workspace/db", () => ({ prisma: callbackPrisma }));

vi.mock("@/server/auth", () => ({
  auth: {
    api: {
      getSession: getSessionDouble,
      getFullOrganization: getFullOrganizationDouble,
    },
  },
}));

vi.mock("@/app/_domains/integration/_services/slack/slack-client", () => ({
  SLACK_OAUTH_SCOPES: "chat:write,chat:write.public,channels:read",
  exchangeOAuthCode: exchangeOAuthCodeDouble,
}));

vi.mock("@/app/_domains/integration/_services/slack/token-crypto", () => ({
  encryptSlackToken: (plain: string) => `encrypted:${plain}`,
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
  if (cookieState) headers.set("cookie", `slack_oauth_state=${cookieState}`);

  return new NextRequest(url, { method: "GET", headers });
}

function location(response: Response) {
  return response.headers.get("location");
}

const errorTarget = `${BASE_URL}/integrations?slack=error`;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("BETTER_AUTH_URL", BASE_URL);
  getSessionDouble.mockResolvedValue({ user: { id: USER_ID } });
  getFullOrganizationDouble.mockResolvedValue({ id: ORGANIZATION_ID });
  callbackPrisma.member.findFirst.mockResolvedValue({ id: MEMBER_ID });
  callbackPrisma.slackInstallation.upsert.mockResolvedValue({
    id: "slack_installation_1",
  });
  exchangeOAuthCodeDouble.mockResolvedValue(INSTALLATION);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/slack/callback", () => {
  it("passes a refusal from Slack through as the error query parameter", async () => {
    const response = await GET(callbackRequest({ error: "access_denied" }));

    expect(response.status).toBe(307);
    expect(location(response)).toBe(errorTarget);
    expect(exchangeOAuthCodeDouble).not.toHaveBeenCalled();
  });

  it("refuses a callback with no code", async () => {
    const response = await GET(callbackRequest({ code: null }));

    expect(response.status).toBe(307);
    expect(location(response)).toBe(errorTarget);
    expect(exchangeOAuthCodeDouble).not.toHaveBeenCalled();
  });

  it("refuses a callback with no state", async () => {
    const response = await GET(callbackRequest({ state: null }));

    expect(response.status).toBe(307);
    expect(location(response)).toBe(errorTarget);
    expect(exchangeOAuthCodeDouble).not.toHaveBeenCalled();
  });

  it("refuses a state that does not match the cookie", async () => {
    const response = await GET(callbackRequest({ cookieState: "other_state" }));

    expect(response.status).toBe(307);
    expect(location(response)).toBe(errorTarget);
    expect(getSessionDouble).not.toHaveBeenCalled();
  });

  it("refuses a callback with no state cookie at all", async () => {
    const response = await GET(callbackRequest({ cookieState: null }));

    expect(response.status).toBe(307);
    expect(location(response)).toBe(errorTarget);
    expect(getSessionDouble).not.toHaveBeenCalled();
  });

  it("refuses a signed out caller", async () => {
    getSessionDouble.mockResolvedValue(null);

    const response = await GET(callbackRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(errorTarget);
    expect(exchangeOAuthCodeDouble).not.toHaveBeenCalled();
  });

  it("refuses a caller with no active Organization", async () => {
    getFullOrganizationDouble.mockResolvedValue(null);

    const response = await GET(callbackRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(errorTarget);
    expect(callbackPrisma.member.findFirst).not.toHaveBeenCalled();
  });

  it("refuses a caller who is not an owner or admin Member", async () => {
    callbackPrisma.member.findFirst.mockResolvedValue(null);

    const response = await GET(callbackRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(errorTarget);
    expect(exchangeOAuthCodeDouble).not.toHaveBeenCalled();
    expect(callbackPrisma.slackInstallation.upsert).not.toHaveBeenCalled();
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

  it("exchanges the code against the registered redirect uri", async () => {
    await GET(callbackRequest());

    expect(exchangeOAuthCodeDouble).toHaveBeenCalledWith({
      code: CODE,
      redirectUri: REDIRECT_URI,
    });
  });

  it("refuses when the code exchange fails at Slack", async () => {
    exchangeOAuthCodeDouble.mockRejectedValue(new Error("invalid_code"));

    const response = await GET(callbackRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(errorTarget);
    expect(callbackPrisma.slackInstallation.upsert).not.toHaveBeenCalled();
  });

  it("records the Installation with an encrypted bot token and lands back on the integrations screen", async () => {
    const response = await GET(callbackRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(`${BASE_URL}/integrations?slack=connected`);

    const installationColumns = {
      slackTeamId: INSTALLATION.teamId,
      slackTeamName: INSTALLATION.teamName,
      botToken: `encrypted:${INSTALLATION.botToken}`,
      botUserId: INSTALLATION.botUserId,
      scope: INSTALLATION.scope,
      installedById: MEMBER_ID,
    };

    expect(callbackPrisma.slackInstallation.upsert).toHaveBeenCalledWith({
      where: { organizationId: ORGANIZATION_ID },
      update: installationColumns,
      create: { organizationId: ORGANIZATION_ID, ...installationColumns },
    });
  });

  it("clears the state cookie once the Installation is recorded", async () => {
    const response = await GET(callbackRequest());

    expect(response.cookies.get("slack_oauth_state")?.value).toBe("");
  });
});
