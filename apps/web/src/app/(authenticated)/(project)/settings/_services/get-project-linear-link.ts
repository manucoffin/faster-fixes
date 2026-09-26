import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { GetProjectLinearLinkInput } from "./get-project-linear-link.schema";

export async function getProjectLinearLink(
  { projectId, userId }: GetProjectLinearLinkInput & { userId: string },
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

  const link = await db.projectLinearLink.findUnique({
    where: { projectId },
    select: {
      id: true,
      teamId: true,
      teamKey: true,
      teamName: true,
      autoCreateIssues: true,
      defaultLabelIds: true,
      defaultPriority: true,
      defaultStateId: true,
      linkHealthIssue: true,
    },
  });

  return link;
}

export type GetProjectLinearLinkOutput = Awaited<
  ReturnType<typeof getProjectLinearLink>
>;
