import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { inngest } from "@/server/inngest";
import {
  buildEvent,
  feedbackStatusChangedEvent,
} from "@/server/inngest/events";
import { prisma } from "@workspace/db";
import type { RestoreFeedbacksInput } from "./restore-feedbacks.schema";

/** Restore: an Archived Feedback goes back to `new` for triage, never to the Status it held before. */
export async function restoreFeedbacks(
  {
    projectId,
    feedbackIds,
    userId,
  }: RestoreFeedbacksInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true },
  });

  if (!project) {
    throw new NotFoundError("Project not found.");
  }

  // Membership in the Project's Organization needs the loaded Project, so the
  // denial lives here rather than at the transport edge.
  const membership = await db.member.findFirst({
    where: { organizationId: project.organizationId, userId },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied.");
  }

  const requested = new Set(feedbackIds).size;

  // Ids outside the Project or no longer Archived are skipped rather than
  // refused: a teammate or a Tracker sync may have moved part of a stale
  // selection on already, and Restore must not drag it back to `new`.
  const targets = await db.feedback.findMany({
    where: { id: { in: feedbackIds }, projectId, status: "closed" },
    select: { id: true },
  });
  const targetIds = targets.map((f) => f.id);

  if (targetIds.length === 0) {
    return { restored: 0, requested };
  }

  const { count: restored } = await db.feedback.updateMany({
    where: { id: { in: targetIds }, projectId, status: "closed" },
    data: { status: "new" },
  });

  // Fan-out: one event per feedback so each gets independent retries and
  // fault isolation. Trackers reopen their Issue from it (ADR-0007).
  const events = targetIds.map((feedbackId) =>
    buildEvent(feedbackStatusChangedEvent, {
      feedbackId,
      newStatus: "new",
      actor: "user",
    }),
  );
  inngest.send(events).catch(() => {});

  return { restored, requested };
}
