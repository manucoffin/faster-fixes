import { BadRequestError, ForbiddenError } from "@/server/errors/domain-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getFullOrganization = vi.fn();

vi.mock("@/server/auth", () => ({
  auth: { api: { getFullOrganization } },
}));

const { disconnectGitHub } = await import("./disconnect-github");

type FakeDb = NonNullable<Parameters<typeof disconnectGitHub>[1]>;

function fakeDb(membership: { id: string } | null) {
  return {
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    gitHubInstallation: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
  } as unknown as FakeDb;
}

const input = { headers: new Headers(), userId: "user_1" };

describe("disconnectGitHub", () => {
  beforeEach(() => {
    getFullOrganization.mockReset();
  });

  it("refuses a session with no active organization", async () => {
    getFullOrganization.mockResolvedValue(null);
    const db = fakeDb({ id: "member_1" });

    await expect(disconnectGitHub(input, db)).rejects.toThrow(
      new BadRequestError("No active organization."),
    );
    expect(db.gitHubInstallation.deleteMany).not.toHaveBeenCalled();
  });

  it("refuses a caller who is not the organization owner", async () => {
    getFullOrganization.mockResolvedValue({ id: "org_1" });
    const db = fakeDb(null);

    await expect(disconnectGitHub(input, db)).rejects.toThrow(
      new ForbiddenError("Only the organization owner can disconnect GitHub."),
    );
    expect(db.member.findFirst).toHaveBeenCalledWith({
      where: { organizationId: "org_1", userId: "user_1", role: "owner" },
    });
    expect(db.gitHubInstallation.deleteMany).not.toHaveBeenCalled();
  });

  it("drops the installation of the active organization for its owner", async () => {
    getFullOrganization.mockResolvedValue({ id: "org_1" });
    const db = fakeDb({ id: "member_1" });

    await expect(disconnectGitHub(input, db)).resolves.toEqual({
      success: true,
    });
    expect(db.gitHubInstallation.deleteMany).toHaveBeenCalledWith({
      where: { organizationId: "org_1" },
    });
  });
});
