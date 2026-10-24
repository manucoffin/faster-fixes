import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateFeedbacksStatus } from "./update-feedbacks-status";

const send = vi
  .fn<(payload: unknown) => Promise<void>>()
  .mockResolvedValue(undefined);

vi.mock("@/server/inngest", () => ({
  inngest: { send: (payload: unknown) => send(payload) },
}));

type FakeDb = NonNullable<Parameters<typeof updateFeedbacksStatus>[1]>;

function fakeDb(
  project: { organizationId: string } | null,
  membership: { id: string } | null,
  targets: Array<{ id: string }> = [],
) {
  return {
    project: { findUnique: vi.fn().mockResolvedValue(project) },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    feedback: {
      findMany: vi.fn().mockResolvedValue(targets),
      updateMany: vi.fn().mockResolvedValue({ count: targets.length }),
    },
  } as unknown as FakeDb;
}

const project = { organizationId: "org_1" };
const member = { id: "member_1" };

const input = {
  projectId: "project_1",
  feedbackIds: ["feedback_1", "feedback_foreign"],
  status: "resolved" as const,
  userId: "user_1",
};

describe("updateFeedbacksStatus", () => {
  beforeEach(() => {
    send.mockClear();
  });

  it("reports an unknown project as not found", async () => {
    await expect(
      updateFeedbacksStatus(input, fakeDb(null, null)),
    ).rejects.toThrow(new NotFoundError("Project not found."));
  });

  it("refuses a caller who is not a member of the project's organization", async () => {
    const db = fakeDb(project, null);

    await expect(updateFeedbacksStatus(input, db)).rejects.toThrow(
      new ForbiddenError("Access denied."),
    );
    expect(db.feedback.updateMany).not.toHaveBeenCalled();
  });

  it("updates only feedback of the project and announces each one", async () => {
    const db = fakeDb(project, member, [{ id: "feedback_1" }]);

    await expect(updateFeedbacksStatus(input, db)).resolves.toEqual({
      count: 1,
    });
    expect(db.feedback.findMany).toHaveBeenCalledWith({
      where: { id: { in: input.feedbackIds }, projectId: "project_1" },
      select: { id: true },
    });
    expect(db.feedback.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["feedback_1"] }, projectId: "project_1" },
      data: { status: "resolved" },
    });
    expect(send).toHaveBeenCalledWith([
      expect.objectContaining({
        data: {
          feedbackId: "feedback_1",
          newStatus: "resolved",
          actor: "user",
        },
      }),
    ]);
  });

  it("changes nothing and announces nothing when no id belongs to the project", async () => {
    const db = fakeDb(project, member);

    await expect(updateFeedbacksStatus(input, db)).resolves.toEqual({
      count: 0,
    });
    expect(db.feedback.updateMany).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
});
