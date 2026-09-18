import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { RestoreReviewerInput } from "./restore-reviewer.schema";

export async function restoreReviewer(
  { reviewerId, userId }: RestoreReviewerInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const reviewer = await db.reviewer.findUnique({
    where: { id: reviewerId },
    include: { project: true },
  });

  if (!reviewer) {
    throw new NotFoundError("Reviewer not found.");
  }

  // Ownership of the Reviewer runs through its Project's Organization, so the
  // denial needs the loaded row and lives here rather than at the transport edge.
  const membership = await db.member.findFirst({
    where: {
      organizationId: reviewer.project.organizationId,
      userId,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied.");
  }

  await db.reviewer.update({
    where: { id: reviewerId },
    data: { isActive: true },
  });

  return { id: reviewerId };
}
