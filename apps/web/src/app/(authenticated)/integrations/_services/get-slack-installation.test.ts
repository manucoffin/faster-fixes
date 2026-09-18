import { BadRequestError, ForbiddenError } from "@/server/errors/domain-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getFullOrganization = vi.fn();

vi.mock("@/server/auth", () => ({
  auth: { api: { getFullOrganization } },
}));

const { getSlackInstallation } = await import("./get-slack-installation");

type FakeDb = NonNullable<Parameters<typeof getSlackInstallation>[1]>;

function fakeDb(
  membership: { id: string } | null,
  installation: { id: string; slackTeamName: string } | null = null,
) {
  return {
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    slackInstallation: { findUnique: vi.fn().mockResolvedValue(installation) },
    project: { findFirst: vi.fn().mockResolvedValue(null) },
    projectSlackLink: { findUnique: vi.fn().mockResolvedValue(null) },
  } as unknown as FakeDb;
}

const input = { headers: new Headers(), userId: "user_1" };

describe("getSlackInstallation", () => {
  beforeEach(() => {
    getFullOrganization.mockReset();
  });

  it("refuses a session with no active organization", async () => {
    getFullOrganization.mockResolvedValue(null);

    await expect(
      getSlackInstallation(input, fakeDb({ id: "member_1" })),
    ).rejects.toThrow(new BadRequestError("No active organization."));
  });

  it("refuses a caller who is not a member of the organization", async () => {
    getFullOrganization.mockResolvedValue({ id: "org_1" });

    await expect(getSlackInstallation(input, fakeDb(null))).rejects.toThrow(
      new ForbiddenError("Access denied."),
    );
  });

  it("reads the installation for a plain member, without requiring a role", async () => {
    getFullOrganization.mockResolvedValue({ id: "org_1" });
    const db = fakeDb({ id: "member_1" });

    await expect(getSlackInstallation(input, db)).resolves.toBeNull();
    expect(db.member.findFirst).toHaveBeenCalledWith({
      where: { organizationId: "org_1", userId: "user_1" },
    });
  });
});
