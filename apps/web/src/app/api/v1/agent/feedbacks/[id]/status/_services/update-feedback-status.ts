import type { FeedbackStatus } from "@/app/_domains/feedback/_types/feedback-status";
import { NotFoundError } from "@/server/errors/domain-errors";
import { inngest } from "@/server/inngest";
import { prisma } from "@workspace/db";

type UpdateFeedbackStatusInput = {
  feedbackId: string;
  status: FeedbackStatus;
  /** The projects the Agent token's Organization owns: the write's whole scope. */
  organizationProjects: Array<{ id: string }>;
};

/**
 * Sets a Feedback's Status on behalf of an Agent token. The dashboard has its
 * own `updateFeedbackStatus`: that one authorizes on Membership of the
 * Feedback's Organization and records a `user` Status actor, this one on the
 * Project belonging to the token's Organization and records an `agent` actor.
 */
export async function updateFeedbackStatus(
  { feedbackId, status, organizationProjects }: UpdateFeedbackStatusInput,
  db: typeof prisma = prisma,
) {
  const feedback = await db.feedback.findFirst({
    where: {
      id: feedbackId,
      projectId: { in: organizationProjects.map((p) => p.id) },
    },
    select: { id: true, status: true },
  });

  if (!feedback) {
    // No period: this copy is the published agent API contract.
    throw new NotFoundError("Feedback not found");
  }

  const previousStatus = feedback.status;
  const updated = await db.feedback.update({
    where: { id: feedback.id },
    data: { status },
    select: { id: true, status: true, updatedAt: true },
  });

  // Fire-and-forget: sync status to the linked tracker if there is one. Skip on
  // no-op — a redundant status set (common when an agent loops over a queue)
  // shouldn't re-fan-out to external trackers, which is the costly part of a
  // write. The dashboard service does fan out on a no-op; see the migration log.
  if (status !== previousStatus) {
    inngest
      .send({
        name: "feedback/status-changed",
        // actor "agent": this service is only reachable with an agent token.
        data: { feedbackId: feedback.id, newStatus: status, actor: "agent" },
      })
      .catch(() => {});
  }

  // `previousStatus` travels back so the boundary can name the transition in
  // its access log without reading the row a second time.
  return {
    id: updated.id,
    status: updated.status,
    updatedAt: updated.updatedAt,
    previousStatus,
  };
}

export type UpdateFeedbackStatusOutput = Awaited<
  ReturnType<typeof updateFeedbackStatus>
>;
