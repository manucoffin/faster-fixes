import { BadRequestError, ForbiddenError } from "@/server/errors/domain-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getFullOrganization = vi.fn();

vi.mock("@/server/auth", () => ({
  auth: { api: { getFullOrganization } },
}));

// The GitHub App client reads its credentials at import time, and no case here
// reaches the Octokit call.
vi.mock("@/app/_domains/integration/_services/github/github-app", () => ({
  getInstallationOctokit: vi.fn(),
}));

const { listAccessibleRepos } = await import("./list-accessible-repos");

type FakeDb = NonNullable<Parameters<typeof listAccessibleRepos>[1]>;

function fakeDb(
  membership: { id: string } | null,
  installation: { installationId: number } | null = null,
) {
  return {
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    gitHubInstallation: { findFirst: vi.fn().mockResolvedValue(installation) },
  } as unknown as FakeDb;
}

const input = { userId: "user_1", headers: new Headers() };

describe("listAccessibleRepos", () => {
  beforeEach(() => {
    getFullOrganization.mockReset();
  });

  it("refuses a session with no active organization", async () => {
    getFullOrganization.mockResolvedValue(null);

    await expect(
      listAccessibleRepos(input, fakeDb({ id: "member_1" })),
    ).rejects.toThrow(new BadRequestError("No active organization."));
  });

  it("refuses a caller who is not an owner or an admin", async () => {
    getFullOrganization.mockResolvedValue({ id: "org_1" });

    await expect(listAccessibleRepos(input, fakeDb(null))).rejects.toThrow(
      new ForbiddenError("Only owners and admins can list repositories."),
    );
  });

  it("returns no repository when GitHub is not installed", async () => {
    getFullOrganization.mockResolvedValue({ id: "org_1" });

    await expect(
      listAccessibleRepos(input, fakeDb({ id: "member_1" })),
    ).resolves.toEqual([]);
  });
});
