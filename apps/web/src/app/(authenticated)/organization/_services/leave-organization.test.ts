import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";

const { leaveOrganization } = await import("./leave-organization");

type FakeDb = NonNullable<Parameters<typeof leaveOrganization>[1]>;

function fakeDb(membership: { id: string; role: string } | null) {
  return {
    member: {
      findFirst: vi.fn().mockResolvedValue(membership),
      delete: vi.fn().mockResolvedValue(membership),
    },
  } as unknown as FakeDb;
}

describe("leaveOrganization", () => {
  it("reports a non-member as a not found domain error", async () => {
    await expect(
      leaveOrganization(
        { organizationId: "org_1", userId: "user_1" },
        fakeDb(null),
      ),
    ).rejects.toThrow(
      new NotFoundError("You are not a member of this organization."),
    );
  });

  it("refuses to let the owner leave", async () => {
    await expect(
      leaveOrganization(
        { organizationId: "org_1", userId: "user_1" },
        fakeDb({ id: "member_1", role: "owner" }),
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it("removes the membership of a plain member", async () => {
    const db = fakeDb({ id: "member_1", role: "member" });

    await expect(
      leaveOrganization({ organizationId: "org_1", userId: "user_1" }, db),
    ).resolves.toEqual({ success: true });
    expect(db.member.delete).toHaveBeenCalledWith({
      where: { id: "member_1" },
    });
  });
});
