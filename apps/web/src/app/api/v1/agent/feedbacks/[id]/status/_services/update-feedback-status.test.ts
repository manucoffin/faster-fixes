import type { FeedbackStatus } from "@/app/_domains/feedback";
import { inMemoryStatusConvergence } from "@/app/_domains/integration/_services/_in-memory-status-convergence";
import { NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import { updateFeedbackStatus } from "./update-feedback-status";

type FakeDb = NonNullable<Parameters<typeof updateFeedbackStatus>[1]>;

const FEEDBACK_ID = "feedback_1";
const ORGANIZATION_PROJECTS = [{ id: "project_1" }];
const UPDATED_AT = new Date("2026-01-02T03:04:05.000Z");

/**
 * A database filtered the way the service queries it: the feedback is visible
 * only when its project is one of the token organization's, so a feedback on
 * another organization's project reads as absent. Its Status is the one the
 * convergence holds, so a write shows in the row read back.
 */
function setup({
  projectId = "project_1",
  status = "new",
}: { projectId?: string; status?: FeedbackStatus } = {}) {
  const convergence = inMemoryStatusConvergence({ [FEEDBACK_ID]: status });
  const db = {
    feedback: {
      findFirst: vi.fn(
        async ({ where }: { where: { projectId: { in: string[] } } }) =>
          where.projectId.in.includes(projectId)
            ? { id: FEEDBACK_ID, status: convergence.statuses.get(FEEDBACK_ID) }
            : null,
      ),
      findUniqueOrThrow: vi.fn(async () => ({
        id: FEEDBACK_ID,
        status: convergence.statuses.get(FEEDBACK_ID),
        updatedAt: UPDATED_AT,
      })),
    },
  } as unknown as FakeDb;

  return { db, convergence };
}

describe("updateFeedbackStatus", () => {
  it("reports a feedback outside the token's organization as not found", async () => {
    const { db, convergence } = setup({ projectId: "someone-elses-project" });

    await expect(
      updateFeedbackStatus(
        {
          feedbackId: FEEDBACK_ID,
          status: "resolved",
          organizationProjects: ORGANIZATION_PROJECTS,
        },
        db,
        convergence,
      ),
    ).rejects.toThrow(new NotFoundError("Feedback not found"));

    expect(convergence.statuses.get(FEEDBACK_ID)).toBe("new");
    expect(convergence.events).toEqual([]);
  });

  it("stores the new status and reports the transition", async () => {
    const { db, convergence } = setup({ status: "new" });

    const result = await updateFeedbackStatus(
      {
        feedbackId: FEEDBACK_ID,
        status: "resolved",
        organizationProjects: ORGANIZATION_PROJECTS,
      },
      db,
      convergence,
    );

    expect(result).toEqual({
      id: FEEDBACK_ID,
      status: "resolved",
      updatedAt: UPDATED_AT,
      previousStatus: "new",
    });
    expect(convergence.statuses.get(FEEDBACK_ID)).toBe("resolved");
  });

  it("fans a real change out to the integrations as the agent actor", async () => {
    const { db, convergence } = setup({ status: "new" });

    await updateFeedbackStatus(
      {
        feedbackId: FEEDBACK_ID,
        status: "in_progress",
        organizationProjects: ORGANIZATION_PROJECTS,
      },
      db,
      convergence,
    );

    expect(convergence.events).toEqual([
      { feedbackId: FEEDBACK_ID, newStatus: "in_progress", actor: "agent" },
    ]);
  });

  /**
   * The settled gap with the dashboard service, which does fan out on a no-op:
   * an agent looping over a queue re-sets the status it already read, and the
   * fan-out is the costly half of the write. See ADR-0007.
   */
  it("answers a no-op status set with the row and sends no event", async () => {
    const { db, convergence } = setup({ status: "resolved" });

    const result = await updateFeedbackStatus(
      {
        feedbackId: FEEDBACK_ID,
        status: "resolved",
        organizationProjects: ORGANIZATION_PROJECTS,
      },
      db,
      convergence,
    );

    expect(result).toEqual({
      id: FEEDBACK_ID,
      status: "resolved",
      updatedAt: UPDATED_AT,
      previousStatus: "resolved",
    });
    expect(convergence.events).toEqual([]);
  });
});
