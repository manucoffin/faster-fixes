import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import { updateFeedbackAssignee } from "./update-feedback-assignee";

type FakeDb = NonNullable<Parameters<typeof updateFeedbackAssignee>[1]>;

function fakeDb(
  feedback: { project: { organizationId: string } } | null,
  members: Array<{ id: string } | null>,
) {
  const findFirst = vi.fn();
  members.forEach((member) => findFirst.mockResolvedValueOnce(member));

  return {
    feedback: {
      findUnique: vi.fn().mockResolvedValue(feedback),
      update: vi.fn().mockResolvedValue({ id: "feedback_1" }),
    },
    member: { findFirst },
  } as unknown as FakeDb;
}

const feedback = { project: { organizationId: "org_1" } };
const caller = { id: "member_1" };
const input = {
  feedbackId: "feedback_1",
  assigneeId: "member_2" as string | null,
  userId: "user_1",
};

describe("updateFeedbackAssignee", () => {
  it("reports an unknown feedback as not found", async () => {
    await expect(
      updateFeedbackAssignee(input, fakeDb(null, [])),
    ).rejects.toThrow(new NotFoundError("Feedback not found."));
  });

  it("refuses a caller who is not a member of the project's organization", async () => {
    await expect(
      updateFeedbackAssignee(input, fakeDb(feedback, [null])),
    ).rejects.toThrow(new ForbiddenError("Access denied."));
  });

  it("reports an assignee outside the organization as not found", async () => {
    await expect(
      updateFeedbackAssignee(input, fakeDb(feedback, [caller, null])),
    ).rejects.toThrow(new NotFoundError("Member not found."));
  });

  it("assigns the feedback to a member of the same organization", async () => {
    const db = fakeDb(feedback, [caller, { id: "member_2" }]);

    await expect(updateFeedbackAssignee(input, db)).resolves.toEqual({
      id: "feedback_1",
    });
    expect(db.feedback.update).toHaveBeenCalledWith({
      where: { id: "feedback_1" },
      data: { assigneeId: "member_2" },
    });
  });

  it("clears the assignee without looking up a member", async () => {
    const db = fakeDb(feedback, [caller]);

    await expect(
      updateFeedbackAssignee({ ...input, assigneeId: null }, db),
    ).resolves.toEqual({ id: "feedback_1" });
    expect(db.member.findFirst).toHaveBeenCalledTimes(1);
  });
});
