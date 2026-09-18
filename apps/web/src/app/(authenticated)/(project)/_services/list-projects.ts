import { ForbiddenError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { ListProjectsInput } from "./list-projects.schema";

export async function listProjects(
  { organizationId, userId }: ListProjectsInput & { userId: string },
  db: typeof prisma = prisma,
) {
  // The denial reads the loaded membership, so it belongs here rather than at
  // the transport edge.
  const membership = await db.member.findFirst({
    where: { organizationId, userId },
  });

  if (!membership) {
    throw new ForbiddenError("You do not have access to this organization.");
  }

  const projects = await db.project.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { feedback: true } },
    },
  });

  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    domain: p.domain,
    apiKeyLastFour: p.apiKeyLastFour,
    createdAt: p.createdAt,
    feedbackCount: p._count.feedback,
  }));
}

export type ListProjectsOutput = Awaited<ReturnType<typeof listProjects>>;
