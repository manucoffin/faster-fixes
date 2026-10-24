import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { restoreFeedbacks } from "./restore-feedbacks";

const send = vi
  .fn<(payload: unknown) => Promise<void>>()
  .mockResolvedValue(undefined);

vi.mock("@/server/inngest", () => ({
  inngest: { send: (payload: unknown) => send(payload) },
}));

type FakeDb = NonNullable<Parameters<typeof restoreFeedbacks>[1]>;

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
  feedbackIds: ["feedback_1", "feedback_2", "feedback_3"],
  userId: "user_1",
};

describe("restoreFeedbacks", () => {
  beforeEach(() => {
    send.mockClear();
  });

  it("reports an unknown project as not found", async () => {
    await expect(restoreFeedbacks(input, fakeDb(null, null))).rejects.toThrow(
      new NotFoundError("Project not found."),
    );
  });

  it("refuses a caller who is not a member of the project's organization", async () => {
    const db = fakeDb(project, null);

    await expect(restoreFeedbacks(input, db)).rejects.toThrow(
      new ForbiddenError("Access denied."),
    );
    expect(db.feedback.updateMany).not.toHaveBeenCalled();
  });

  it("restores only archived feedback of the project to new and announces each one", async () => {
    const db = fakeDb(project, member, [
      { id: "feedback_1" },
      { id: "feedback_2" },
    ]);

    await expect(restoreFeedbacks(input, db)).resolves.toEqual({
      restored: 2,
      requested: 3,
    });
    expect(db.feedback.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: input.feedbackIds },
        projectId: "project_1",
        status: "closed",
      },
      select: { id: true },
    });
    expect(db.feedback.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["feedback_1", "feedback_2"] },
        projectId: "project_1",
        status: "closed",
      },
      data: { status: "new" },
    });
    expect(send).toHaveBeenCalledWith([
      expect.objectContaining({
        data: { feedbackId: "feedback_1", newStatus: "new", actor: "user" },
      }),
      expect.objectContaining({
        data: { feedbackId: "feedback_2", newStatus: "new", actor: "user" },
      }),
    ]);
  });

  it("counts a repeated id once", async () => {
    const db = fakeDb(project, member);

    await expect(
      restoreFeedbacks(
        { ...input, feedbackIds: ["feedback_1", "feedback_1"] },
        db,
      ),
    ).resolves.toEqual({ restored: 0, requested: 1 });
  });

  it("changes nothing and announces nothing when no id is still archived in the project", async () => {
    const db = fakeDb(project, member);

    await expect(restoreFeedbacks(input, db)).resolves.toEqual({
      restored: 0,
      requested: 3,
    });
    expect(db.feedback.updateMany).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
});
