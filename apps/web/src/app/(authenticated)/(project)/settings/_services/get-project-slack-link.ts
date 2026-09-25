import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { GetProjectSlackLinkInput } from "./get-project-slack-link.schema";

export async function getProjectSlackLink(
  { projectId, userId }: GetProjectSlackLinkInput & { userId: string },
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

  const link = await db.projectSlackLink.findUnique({
    where: { projectId },
    select: {
      id: true,
      channelId: true,
      channelName: true,
      enabled: true,
      linkHealthy: true,
      healthIssue: true,
    },
  });

  return link;
}

export type GetProjectSlackLinkOutput = Awaited<
  ReturnType<typeof getProjectSlackLink>
>;
