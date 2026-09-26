import { NotFoundError } from "@/server/errors/domain-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The Inngest client is built at import time and its send is a side effect the
// service fires without awaiting, so it is replaced at the module boundary.
const inngestSendDouble = vi.hoisted(() => vi.fn());
vi.mock("@/server/inngest", () => ({
  inngest: { send: inngestSendDouble },
}));

const { updateFeedbackStatus } = await import("./update-feedback-status");

type FakeDb = NonNullable<Parameters<typeof updateFeedbackStatus>[1]>;

const FEEDBACK_ID = "feedback_1";
const ORGANIZATION_PROJECTS = [{ id: "project_1" }];
const UPDATED_AT = new Date("2026-01-02T03:04:05.000Z");

/**
 * A database filtered the way the service queries it: the feedback is visible
 * only when its project is one of the token organization's, so a feedback on
 * another organization's project reads as absent.
 */
function fakeDb({
  projectId = "project_1",
  status = "new",
}: { projectId?: string; status?: string } = {}) {
  return {
    feedback: {
      findFirst: vi.fn(
        async ({ where }: { where: { projectId: { in: string[] } } }) =>
          where.projectId.in.includes(projectId)
            ? { id: FEEDBACK_ID, status }
            : null,
      ),
      update: vi.fn(async ({ data }: { data: { status: string } }) => ({
        id: FEEDBACK_ID,
        status: data.status,
        updatedAt: UPDATED_AT,
      })),
    },
  } as unknown as FakeDb;
}

beforeEach(() => {
  vi.clearAllMocks();
  inngestSendDouble.mockResolvedValue(undefined);
});

describe("updateFeedbackStatus", () => {
  it("reports a feedback outside the token's organization as not found", async () => {
    const db = fakeDb({ projectId: "someone-elses-project" });

    await expect(
      updateFeedbackStatus(
        {
          feedbackId: FEEDBACK_ID,
          status: "resolved",
          organizationProjects: ORGANIZATION_PROJECTS,
        },
        db,
      ),
    ).rejects.toThrow(new NotFoundError("Feedback not found"));

    expect(db.feedback.update).not.toHaveBeenCalled();
    expect(inngestSendDouble).not.toHaveBeenCalled();
  });

  it("stores the new status and reports the transition", async () => {
    const db = fakeDb({ status: "new" });

    const result = await updateFeedbackStatus(
      {
        feedbackId: FEEDBACK_ID,
        status: "resolved",
        organizationProjects: ORGANIZATION_PROJECTS,
      },
      db,
    );

    expect(result).toEqual({
      id: FEEDBACK_ID,
      status: "resolved",
      updatedAt: UPDATED_AT,
      previousStatus: "new",
    });
  });

  it("fans a real change out to the integrations as the agent actor", async () => {
    const db = fakeDb({ status: "new" });

    await updateFeedbackStatus(
      {
        feedbackId: FEEDBACK_ID,
        status: "in_progress",
        organizationProjects: ORGANIZATION_PROJECTS,
      },
      db,
    );

    expect(inngestSendDouble).toHaveBeenCalledWith({
      name: "feedback/status-changed",
      data: {
        feedbackId: FEEDBACK_ID,
        newStatus: "in_progress",
        actor: "agent",
      },
    });
  });

  /**
   * The settled gap with the dashboard service, which does fan out on a no-op:
   * an agent looping over a queue re-sets the status it already read, and the
   * fan-out is the costly half of the write. See ADR-0007.
   */
  it("writes a no-op status set but sends no event", async () => {
    const db = fakeDb({ status: "resolved" });

    const result = await updateFeedbackStatus(
      {
        feedbackId: FEEDBACK_ID,
        status: "resolved",
        organizationProjects: ORGANIZATION_PROJECTS,
      },
      db,
    );

    expect(result.previousStatus).toBe("resolved");
    expect(db.feedback.update).toHaveBeenCalledTimes(1);
    expect(inngestSendDouble).not.toHaveBeenCalled();
  });
});
