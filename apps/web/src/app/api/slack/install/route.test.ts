/**
 * Characterization tests: they pin what a User starting the Slack connection
 * observes today (status, redirect target, error query parameter, authorize
 * parameters, state cookie), so moving the Plan check behind a service can be
 * proven behaviour-preserving. They assert on responses only, never on how the
 * handler reaches them.
 *
 * A test here that has to change is a broken contract: the install URL and the
 * authorize parameters are what the Slack app registered at Slack expects, and
 * the state cookie is the CSRF defence the callback reads back.
 */

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const BASE_URL = "https://app.test";
const CLIENT_ID = "slack_client_id";
const USER_ID = "user_1";
const ORGANIZATION_ID = "org_1";

const installPrisma = {
  subscription: { findFirst: vi.fn() },
};

const getSessionDouble = vi.fn();
const getFullOrganizationDouble = vi.fn();

vi.mock("@workspace/db", () => ({ prisma: installPrisma }));

vi.mock("@/server/auth", () => ({
  auth: {
    api: {
      getSession: getSessionDouble,
      getFullOrganization: getFullOrganizationDouble,
    },
  },
}));

const { GET } = await import("./route");

function installRequest() {
  return new NextRequest(new URL(`${BASE_URL}/api/slack/install`), {
    method: "GET",
  });
}

function location(response: Response) {
  return response.headers.get("location");
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("BETTER_AUTH_URL", BASE_URL);
  vi.stubEnv("SLACK_CLIENT_ID", CLIENT_ID);
  // Plan enforcement only reads a Subscription on the cloud deployment; a
  // self-hosted instance is granted every feature without a query.
  vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "true");
  getSessionDouble.mockResolvedValue({ user: { id: USER_ID } });
  getFullOrganizationDouble.mockResolvedValue({ id: ORGANIZATION_ID });
  installPrisma.subscription.findFirst.mockResolvedValue({
    id: "subscription_1",
    plan: "pro",
    status: "active",
    periodEnd: null,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/slack/install", () => {
  it("sends a signed out caller to the login screen with the install url", async () => {
    getSessionDouble.mockResolvedValue(null);

    const response = await GET(installRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/login?nextUrl=${encodeURIComponent(
        `${BASE_URL}/api/slack/install`,
      )}`,
    );
    expect(getFullOrganizationDouble).not.toHaveBeenCalled();
  });

  it("refuses a caller with no active Organization", async () => {
    getFullOrganizationDouble.mockResolvedValue(null);

    const response = await GET(installRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=no_active_org`,
    );
    expect(installPrisma.subscription.findFirst).not.toHaveBeenCalled();
  });

  it("refuses an Organization whose Plan has no Slack Integration", async () => {
    installPrisma.subscription.findFirst.mockResolvedValue(null);

    const response = await GET(installRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=upgrade_required`,
    );
  });

  it("reads the Plan of the active Organization", async () => {
    await GET(installRequest());

    expect(installPrisma.subscription.findFirst).toHaveBeenCalledWith({
      where: { referenceId: ORGANIZATION_ID },
      orderBy: { createdAt: "desc" },
    });
  });

  it("refuses to start when the Slack client id is not configured", async () => {
    vi.stubEnv("SLACK_CLIENT_ID", "");

    const response = await GET(installRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=slack_not_configured`,
    );
  });

  it("sends the caller to the Slack consent screen with the registered parameters", async () => {
    const response = await GET(installRequest());

    expect(response.status).toBe(307);

    const authorizeUrl = new URL(location(response)!);
    expect(authorizeUrl.origin + authorizeUrl.pathname).toBe(
      "https://slack.com/oauth/v2/authorize",
    );
    expect(Object.fromEntries(authorizeUrl.searchParams)).toEqual({
      client_id: CLIENT_ID,
      scope: "chat:write,chat:write.public,channels:read",
      state: expect.any(String),
      redirect_uri: `${BASE_URL}/api/slack/callback`,
    });
  });

  it("stores the state it echoes to Slack in an httpOnly cookie", async () => {
    const response = await GET(installRequest());

    const state = new URL(location(response)!).searchParams.get("state");
    const cookie = response.cookies.get("slack_oauth_state");

    expect(cookie?.value).toBe(state);
    expect(cookie).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
  });
});
