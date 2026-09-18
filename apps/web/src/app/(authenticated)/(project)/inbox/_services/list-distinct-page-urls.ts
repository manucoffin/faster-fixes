import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { ListDistinctPageUrlsInput } from "./list-distinct-page-urls.schema";

export async function listDistinctPageUrls(
  { projectId, userId }: ListDistinctPageUrlsInput & { userId: string },
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

  const results = await db.feedback.findMany({
    where: { projectId },
    select: { pageUrl: true },
    distinct: ["pageUrl"],
    orderBy: { pageUrl: "asc" },
  });

  return results.map((r) => r.pageUrl);
}

export type ListDistinctPageUrlsOutput = Awaited<
  ReturnType<typeof listDistinctPageUrls>
>;
