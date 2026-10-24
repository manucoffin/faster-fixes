import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { inngest } from "@/server/inngest";
import {
  buildEvent,
  feedbackStatusChangedEvent,
} from "@/server/inngest/events";
import { prisma } from "@workspace/db";
import type { UpdateFeedbacksStatusInput } from "./update-feedbacks-status.schema";

export async function updateFeedbacksStatus(
  {
    projectId,
    feedbackIds,
    status,
    userId,
  }: UpdateFeedbacksStatusInput & { userId: string },
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

  // Ids outside the Project are skipped, never reported, so the response does
  // not reveal whether an id exists in another Organization.
  const targets = await db.feedback.findMany({
    where: { id: { in: feedbackIds }, projectId },
    select: { id: true },
  });
  const targetIds = targets.map((f) => f.id);

  if (targetIds.length === 0) {
    return { count: 0 };
  }

  await db.feedback.updateMany({
    where: { id: { in: targetIds }, projectId },
    data: { status },
  });

  // Fan-out: one event per feedback so each gets independent retries and
  // fault isolation — a single failing GitHub sync won't block the others.
  const events = targetIds.map((feedbackId) =>
    // Dashboard bulk edits are always a human in the inbox.
    buildEvent(feedbackStatusChangedEvent, {
      feedbackId,
      newStatus: status,
      actor: "user",
    }),
  );
  inngest.send(events).catch(() => {});

  return { count: targetIds.length };
}
