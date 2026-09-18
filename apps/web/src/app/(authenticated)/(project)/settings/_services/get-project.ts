import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { GetProjectInput } from "./get-project.schema";

export async function getProject(
  { projectId, userId }: GetProjectInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { widgetConfig: true },
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

  return {
    id: project.id,
    publicId: project.publicId,
    name: project.name,
    domain: project.domain,
    apiKeyLastFour: project.apiKeyLastFour,
    createdAt: project.createdAt,
    widgetConfig: project.widgetConfig
      ? {
          enabled: project.widgetConfig.enabled,
        }
      : null,
  };
}

export type GetProjectOutput = Awaited<ReturnType<typeof getProject>>;
