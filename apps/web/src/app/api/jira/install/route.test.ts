/**
 * Characterization tests: they pin what a User starting the Jira connection
 * observes today (status, redirect target, error query parameter, state
 * cookie), so moving the Member check behind a service can be proven
 * behaviour-preserving. They assert on responses only, never on how the
 * handler reaches them.
 *
 * A test here that has to change is a broken contract: the install URL and the
 * authorize parameters are what the OAuth app registered at Atlassian expects,
 * and the state cookie is the CSRF defence the callback reads back.
 */

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const BASE_URL = "https://app.test";
const CLIENT_ID = "jira_client_id";
const USER_ID = "user_1";
const ORGANIZATION_ID = "org_1";
const MEMBER_ID = "member_1";

const installPrisma = {
  member: { findFirst: vi.fn() },
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
  return new NextRequest(new URL(`${BASE_URL}/api/jira/install`), {
    method: "GET",
  });
}

function location(response: Response) {
  return response.headers.get("location");
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("BETTER_AUTH_URL", BASE_URL);
  vi.stubEnv("JIRA_CLIENT_ID", CLIENT_ID);
  vi.stubEnv("JIRA_OAUTH_REDIRECT_URI", `${BASE_URL}/api/jira/callback`);
  getSessionDouble.mockResolvedValue({ user: { id: USER_ID } });
  getFullOrganizationDouble.mockResolvedValue({ id: ORGANIZATION_ID });
  installPrisma.member.findFirst.mockResolvedValue({ id: MEMBER_ID });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/jira/install", () => {
  it("sends a signed out caller to the login screen with the install url", async () => {
    getSessionDouble.mockResolvedValue(null);

    const response = await GET(installRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/login?nextUrl=${encodeURIComponent(
        `${BASE_URL}/api/jira/install`,
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
    expect(installPrisma.member.findFirst).not.toHaveBeenCalled();
  });

  it("refuses a caller who is not an owner or admin Member", async () => {
    installPrisma.member.findFirst.mockResolvedValue(null);

    const response = await GET(installRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=insufficient_role`,
    );
  });

  it("looks the caller up among the owners and admins of the active Organization", async () => {
    await GET(installRequest());

    expect(installPrisma.member.findFirst).toHaveBeenCalledWith({
      where: {
        organizationId: ORGANIZATION_ID,
        userId: USER_ID,
        role: { in: ["owner", "admin"] },
      },
    });
  });

  it("refuses to start when the Jira client id is not configured", async () => {
    vi.stubEnv("JIRA_CLIENT_ID", "");

    const response = await GET(installRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=jira_not_configured`,
    );
  });

  it("sends the caller to the Atlassian consent screen with the registered parameters", async () => {
    const response = await GET(installRequest());

    expect(response.status).toBe(307);

    const authorizeUrl = new URL(location(response)!);
    expect(authorizeUrl.origin + authorizeUrl.pathname).toBe(
      "https://auth.atlassian.com/authorize",
    );
    expect(Object.fromEntries(authorizeUrl.searchParams)).toEqual({
      audience: "api.atlassian.com",
      client_id: CLIENT_ID,
      scope:
        "read:jira-work write:jira-work read:jira-user manage:jira-webhook offline_access",
      redirect_uri: `${BASE_URL}/api/jira/callback`,
      response_type: "code",
      prompt: "consent",
      state: expect.any(String),
    });
  });

  it("stores the state it echoes to Atlassian in an httpOnly cookie", async () => {
    const response = await GET(installRequest());

    const state = new URL(location(response)!).searchParams.get("state");
    const cookie = response.cookies.get("jira_oauth_state");

    expect(cookie?.value).toBe(state);
    expect(cookie).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
  });
});
