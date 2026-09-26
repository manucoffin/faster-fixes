import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import { revokeReviewer } from "./revoke-reviewer";

type FakeDb = NonNullable<Parameters<typeof revokeReviewer>[1]>;

function fakeDb(
  reviewer: { project: { organizationId: string } } | null,
  membership: { id: string } | null,
) {
  return {
    reviewer: {
      findUnique: vi.fn().mockResolvedValue(reviewer),
      update: vi.fn().mockResolvedValue({ id: "reviewer_1" }),
    },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
  } as unknown as FakeDb;
}

const input = { reviewerId: "reviewer_1", userId: "user_1" };
const reviewer = { project: { organizationId: "org_1" } };

describe("revokeReviewer", () => {
  it("reports an unknown reviewer as not found", async () => {
    await expect(
      revokeReviewer(input, fakeDb(null, { id: "member_1" })),
    ).rejects.toThrow(new NotFoundError("Reviewer not found."));
  });

  it("refuses a caller who is not an owner or an admin of the reviewer's organization", async () => {
    const db = fakeDb(reviewer, null);

    await expect(revokeReviewer(input, db)).rejects.toThrow(
      new ForbiddenError("Access denied."),
    );
    expect(db.member.findFirst).toHaveBeenCalledWith({
      where: {
        organizationId: "org_1",
        userId: "user_1",
        role: { in: ["owner", "admin"] },
      },
    });
  });

  it("deactivates the reviewer for a privileged caller", async () => {
    const db = fakeDb(reviewer, { id: "member_1" });

    await expect(revokeReviewer(input, db)).resolves.toEqual({
      id: "reviewer_1",
    });
    expect(db.reviewer.update).toHaveBeenCalledWith({
      where: { id: "reviewer_1" },
      data: { isActive: false },
    });
  });
});
