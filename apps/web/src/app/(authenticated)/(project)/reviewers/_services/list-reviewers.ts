import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { ListReviewersInput } from "./list-reviewers.schema";

export async function listReviewers(
  { projectId, userId }: ListReviewersInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const project = await db.project.findUnique({ where: { id: projectId } });

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

  const reviewers = await db.reviewer.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { feedback: true } },
    },
  });

  return reviewers.map((r) => ({
    id: r.id,
    name: r.name,
    token: r.token,
    isActive: r.isActive,
    createdAt: r.createdAt,
    feedbackCount: r._count.feedback,
    shareUrl: `https://${project.domain}?ff_token=${r.token}`,
  }));
}

export type ListReviewersOutput = Awaited<ReturnType<typeof listReviewers>>;
