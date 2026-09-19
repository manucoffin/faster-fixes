/**
 * Characterization tests: they pin what a User coming back from the GitHub App
 * installation observes today (status, redirect target, error query parameter)
 * on every refusal path, so moving the Member check and the Installation upsert
 * behind services can be proven behaviour-preserving. They assert on responses
 * only, never on how the handler reaches them.
 *
 * A test here that has to change is a broken contract: the setup URL is
 * registered in the GitHub App and its redirect targets are what the
 * integrations screen reads to tell the User what happened.
 */

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const BASE_URL = "https://app.test";
const INSTALLATION_ID = 42;
const ORGANIZATION_ID = "org_1";
const USER_ID = "user_1";
const MEMBER_ID = "member_1";

const setupPrisma = {
  member: { findFirst: vi.fn() },
  gitHubInstallation: { upsert: vi.fn() },
};

const getSessionDouble = vi.fn();
const getFullOrganizationDouble = vi.fn();
const octokitRequestDouble = vi.fn();

vi.mock("@workspace/db", () => ({ prisma: setupPrisma }));

vi.mock("@/server/auth", () => ({
  auth: {
    api: {
      getSession: getSessionDouble,
      getFullOrganization: getFullOrganizationDouble,
    },
  },
}));

vi.mock("@/app/_domains/integration/_services/github/github-app", () => ({
  getAppOctokit: () => ({ request: octokitRequestDouble }),
}));

const { GET } = await import("./route");

type SetupRequestInit = {
  installationId?: string | null;
  setupAction?: string | null;
};

function setupRequest(init: SetupRequestInit = {}) {
  const { installationId = String(INSTALLATION_ID), setupAction = "install" } =
    init;

  const url = new URL(`${BASE_URL}/api/github/setup`);
  if (installationId) url.searchParams.set("installation_id", installationId);
  if (setupAction) url.searchParams.set("setup_action", setupAction);

  return new NextRequest(url, { method: "GET" });
}

function location(response: Response) {
  return response.headers.get("location");
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("BETTER_AUTH_URL", BASE_URL);
  getSessionDouble.mockResolvedValue({ user: { id: USER_ID } });
  getFullOrganizationDouble.mockResolvedValue({ id: ORGANIZATION_ID });
  setupPrisma.member.findFirst.mockResolvedValue({ id: MEMBER_ID });
  setupPrisma.gitHubInstallation.upsert.mockResolvedValue({});
  octokitRequestDouble.mockResolvedValue({
    data: {
      account: {
        login: "acme",
        type: "Organization",
        avatar_url: "https://avatars.test/acme.png",
      },
    },
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/github/setup", () => {
  it("refuses a callback that carries no installation id", async () => {
    const response = await GET(setupRequest({ installationId: null }));

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=missing_installation_id`,
    );
    expect(getSessionDouble).not.toHaveBeenCalled();
  });

  it("sends a signed out caller to the login screen with the callback url", async () => {
    getSessionDouble.mockResolvedValue(null);

    const response = await GET(setupRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/login?nextUrl=${encodeURIComponent(
        `${BASE_URL}/api/github/setup?installation_id=${INSTALLATION_ID}&setup_action=install`,
      )}`,
    );
    expect(setupPrisma.gitHubInstallation.upsert).not.toHaveBeenCalled();
  });

  it("defaults the callback setup action when the query parameter is missing", async () => {
    getSessionDouble.mockResolvedValue(null);

    const response = await GET(setupRequest({ setupAction: null }));

    expect(location(response)).toBe(
      `${BASE_URL}/login?nextUrl=${encodeURIComponent(
        `${BASE_URL}/api/github/setup?installation_id=${INSTALLATION_ID}&setup_action=install`,
      )}`,
    );
  });

  it("refuses a caller with no active Organization", async () => {
    getFullOrganizationDouble.mockResolvedValue(null);

    const response = await GET(setupRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=no_active_org`,
    );
    expect(setupPrisma.member.findFirst).not.toHaveBeenCalled();
  });

  it("refuses a caller who is not an owner or admin Member", async () => {
    setupPrisma.member.findFirst.mockResolvedValue(null);

    const response = await GET(setupRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=insufficient_role`,
    );
    expect(octokitRequestDouble).not.toHaveBeenCalled();
    expect(setupPrisma.gitHubInstallation.upsert).not.toHaveBeenCalled();
  });

  it("looks the caller up among the owners and admins of the active Organization", async () => {
    await GET(setupRequest());

    expect(setupPrisma.member.findFirst).toHaveBeenCalledWith({
      where: {
        organizationId: ORGANIZATION_ID,
        userId: USER_ID,
        role: { in: ["owner", "admin"] },
      },
    });
  });

  it("refuses an installation GitHub does not know", async () => {
    octokitRequestDouble.mockRejectedValue(new Error("Not Found"));

    const response = await GET(setupRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?error=installation_not_found`,
    );
    expect(setupPrisma.gitHubInstallation.upsert).not.toHaveBeenCalled();
  });

  it("records the Installation and lands back on the integrations screen", async () => {
    const response = await GET(setupRequest());

    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      `${BASE_URL}/integrations?github=connected`,
    );
    expect(setupPrisma.gitHubInstallation.upsert).toHaveBeenCalledWith({
      where: { installationId: INSTALLATION_ID },
      update: {
        accountLogin: "acme",
        accountType: "Organization",
        accountAvatarUrl: "https://avatars.test/acme.png",
      },
      create: {
        organizationId: ORGANIZATION_ID,
        installationId: INSTALLATION_ID,
        accountLogin: "acme",
        accountType: "Organization",
        accountAvatarUrl: "https://avatars.test/acme.png",
        installedById: MEMBER_ID,
      },
    });
  });

  it("stores a null avatar when the GitHub account has none", async () => {
    octokitRequestDouble.mockResolvedValue({
      data: { account: { login: "acme", type: "User" } },
    });

    await GET(setupRequest());

    expect(setupPrisma.gitHubInstallation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ accountAvatarUrl: null }),
        create: expect.objectContaining({ accountAvatarUrl: null }),
      }),
    );
  });
});
