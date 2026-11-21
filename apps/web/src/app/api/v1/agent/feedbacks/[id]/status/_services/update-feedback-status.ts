import type { FeedbackStatus } from "@/app/_domains/feedback";
import { prismaStatusConvergence } from "@/app/_domains/integration/_services/_prisma-status-convergence";
import {
  updateStatus,
  type StatusConvergence,
} from "@/app/_domains/integration/_services/update-status";
import { NotFoundError } from "@/server/errors/domain-errors";
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
  convergence: StatusConvergence = prismaStatusConvergence(db),
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

  // An `agent` actor writes and converges the Trackers only on a real change:
  // an agent looping over a queue re-sets the Status it already read (ADR-0007).
  await updateStatus(
    { feedbackIds: [feedback.id], status, actor: "agent" },
    convergence,
  );

  const updated = await db.feedback.findUniqueOrThrow({
    where: { id: feedback.id },
    select: { id: true, status: true, updatedAt: true },
  });

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
