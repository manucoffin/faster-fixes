import { inMemoryStatusConvergence } from "@/app/_domains/integration/_services/_in-memory-status-convergence";
import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import { restoreFeedbacks } from "./restore-feedbacks";

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
  it("reports an unknown project as not found", async () => {
    await expect(restoreFeedbacks(input, fakeDb(null, null))).rejects.toThrow(
      new NotFoundError("Project not found."),
    );
  });

  it("refuses a caller who is not a member of the project's organization", async () => {
    const convergence = inMemoryStatusConvergence({ feedback_1: "closed" });

    await expect(
      restoreFeedbacks(input, fakeDb(project, null), convergence),
    ).rejects.toThrow(new ForbiddenError("Access denied."));
    expect(convergence.statuses.get("feedback_1")).toBe("closed");
  });

  it("restores only archived feedback of the project to new and announces each one", async () => {
    const db = fakeDb(project, member, [
      { id: "feedback_1" },
      { id: "feedback_2" },
    ]);
    const convergence = inMemoryStatusConvergence({
      feedback_1: "closed",
      feedback_2: "closed",
      feedback_3: "resolved",
    });

    await expect(restoreFeedbacks(input, db, convergence)).resolves.toEqual({
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
    expect(Object.fromEntries(convergence.statuses)).toEqual({
      feedback_1: "new",
      feedback_2: "new",
      feedback_3: "resolved",
    });
    expect(convergence.events).toEqual([
      { feedbackId: "feedback_1", newStatus: "new", actor: "user" },
      { feedbackId: "feedback_2", newStatus: "new", actor: "user" },
    ]);
  });

  it("leaves untouched a Feedback another actor moved out of Archived after it was read", async () => {
    const db = fakeDb(project, member, [
      { id: "feedback_1" },
      { id: "feedback_2" },
    ]);
    const convergence = inMemoryStatusConvergence({
      feedback_1: "closed",
      feedback_2: "in_progress",
    });

    await expect(restoreFeedbacks(input, db, convergence)).resolves.toEqual({
      restored: 1,
      requested: 3,
    });
    expect(convergence.statuses.get("feedback_2")).toBe("in_progress");
    expect(convergence.events).toEqual([
      { feedbackId: "feedback_1", newStatus: "new", actor: "user" },
    ]);
  });

  it("counts a repeated id once", async () => {
    const db = fakeDb(project, member);

    await expect(
      restoreFeedbacks(
        { ...input, feedbackIds: ["feedback_1", "feedback_1"] },
        db,
        inMemoryStatusConvergence(),
      ),
    ).resolves.toEqual({ restored: 0, requested: 1 });
  });

  it("changes nothing and announces nothing when no id is still archived in the project", async () => {
    const convergence = inMemoryStatusConvergence({ feedback_1: "resolved" });

    await expect(
      restoreFeedbacks(input, fakeDb(project, member), convergence),
    ).resolves.toEqual({ restored: 0, requested: 3 });
    expect(convergence.statuses.get("feedback_1")).toBe("resolved");
    expect(convergence.events).toEqual([]);
  });
});
