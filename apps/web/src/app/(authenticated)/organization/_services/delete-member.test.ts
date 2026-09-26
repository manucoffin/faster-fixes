import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";

const { deleteMember } = await import("./delete-member");

type FakeDb = NonNullable<Parameters<typeof deleteMember>[1]>;

type Membership = { id: string; organizationId: string; role: string };

function fakeDb(
  member: Membership | null,
  callerMembership: Membership | null,
) {
  return {
    member: {
      findFirst: vi
        .fn()
        .mockResolvedValueOnce(member)
        .mockResolvedValueOnce(callerMembership),
      delete: vi.fn().mockResolvedValue(member),
    },
  } as unknown as FakeDb;
}

const target: Membership = {
  id: "member_1",
  organizationId: "org_1",
  role: "member",
};
const caller: Membership = {
  id: "member_2",
  organizationId: "org_1",
  role: "admin",
};

describe("deleteMember", () => {
  it("reports an unknown member as a not found domain error", async () => {
    await expect(
      deleteMember(
        { memberId: "member_1", userId: "user_1" },
        fakeDb(null, caller),
      ),
    ).rejects.toThrow(new NotFoundError("Member not found."));
  });

  it("refuses a caller who is neither owner nor admin of the organization", async () => {
    await expect(
      deleteMember(
        { memberId: "member_1", userId: "user_1" },
        fakeDb(target, null),
      ),
    ).rejects.toThrow(
      new ForbiddenError("You do not have permission to remove this member."),
    );
  });

  it("refuses to remove the owner", async () => {
    await expect(
      deleteMember(
        { memberId: "member_1", userId: "user_1" },
        fakeDb({ ...target, role: "owner" }, caller),
      ),
    ).rejects.toThrow(
      new ForbiddenError("Cannot remove the owner of the organization."),
    );
  });

  it("removes a plain member for an admin caller", async () => {
    const db = fakeDb(target, caller);

    await expect(
      deleteMember({ memberId: "member_1", userId: "user_1" }, db),
    ).resolves.toEqual({ success: true });
    expect(db.member.delete).toHaveBeenCalledWith({
      where: { id: "member_1" },
    });
  });
});
