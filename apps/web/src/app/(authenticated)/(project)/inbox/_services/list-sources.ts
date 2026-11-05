import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { ListSourcesInput } from "./list-sources.schema";

// The sources the Task board filters by: the page URLs Feedback was left on
// and the Project's Videos.
export async function listSources(
  { projectId, userId }: ListSourcesInput & { userId: string },
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

  const [pages, videos] = await Promise.all([
    db.feedback.findMany({
      where: { projectId, pageUrl: { not: null } },
      select: { pageUrl: true },
      distinct: ["pageUrl"],
      orderBy: { pageUrl: "asc" },
    }),
    db.video.findMany({
      where: { projectId },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  const pageUrls = [
    ...new Set(pages.flatMap((r) => (r.pageUrl ? [r.pageUrl] : []))),
  ];

  return { pageUrls, videos };
}

export type ListSourcesOutput = Awaited<ReturnType<typeof listSources>>;
