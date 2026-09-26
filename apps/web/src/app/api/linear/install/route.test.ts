/**
 * Characterization tests: they pin what a User starting the Linear connection
 * observes today (status, redirect target, error query parameter, state
 * cookie), so moving the Organization and Member work behind services can be
 * proven behaviour-preserving. They assert on responses only, never on how the
 * handler reaches them.
 *
 * A test here that has to change is a broken contract: the install URL and the
 * authorize parameters are what the OAuth app registered at Linear expects, and
 * the state cookie is the CSRF defence the callback reads back.
 */

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const BASE_URL = "https://app.test";
const CLIENT_ID = "linear_client_id";
const USER_ID = "user_1";
const ORGANIZATION_ID = "org_1";

const getSessionDouble = vi.fn();
const getFullOrganizationDouble = vi.fn();

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
  return new NextRequest(new URL(`${BASE_URL}/api/linear/install`), {
    method: "GET",
  });
}

function location(response: Response) {
  return response.headers.get("location");
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("BETTER_AUTH_URL", BASE_URL);
  vi.stubEnv("LINEAR_CLIENT_ID", CLIENT_ID);
  vi.stubEnv("LINEAR_OAUTH_REDIRECT_URI", `${BASE_URL}/api/linear/callback`);
  getSessionDouble.mockResolvedValue({ user: { id: USER_ID } });
  getFullOrganizationDouble.mockResolvedValue({ id: ORGANIZATION_ID });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/linear/install", () => {
  it("sends a signed out caller to the login screen with the install url", async () => {
    getSessionDouble.mockResolvedValue(null);

    const response = await GET(installRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/login?nextUrl=${encodeURIComponent(
        `${BASE_URL}/api/linear/install`,
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
  });

  it("refuses to start when the Linear client id is not configured", async () => {
    vi.stubEnv("LINEAR_CLIENT_ID", "");

    const response = await GET(installRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=linear_not_configured`,
    );
  });

  it("sends the caller to the Linear consent screen with the registered parameters", async () => {
    const response = await GET(installRequest());

    expect(response.status).toBe(307);

    const authorizeUrl = new URL(location(response)!);
    expect(authorizeUrl.origin + authorizeUrl.pathname).toBe(
      "https://linear.app/oauth/authorize",
    );
    expect(Object.fromEntries(authorizeUrl.searchParams)).toEqual({
      client_id: CLIENT_ID,
      redirect_uri: `${BASE_URL}/api/linear/callback`,
      response_type: "code",
      scope: "read,write",
      state: expect.any(String),
      actor: "app",
    });
  });

  it("stores the state it echoes to Linear in an httpOnly cookie", async () => {
    const response = await GET(installRequest());

    const state = new URL(location(response)!).searchParams.get("state");
    const cookie = response.cookies.get("linear_oauth_state");

    expect(cookie?.value).toBe(state);
    expect(cookie).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
  });
});
