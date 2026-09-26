import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { UpdateProjectLinearLinkInput } from "./update-project-linear-link.schema";

export async function updateProjectLinearLink(
  input: UpdateProjectLinearLinkInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const { projectId, userId } = input;

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true },
  });

  if (!project) {
    throw new NotFoundError("Project not found.");
  }

  // Privileged membership in the Project's Organization needs the loaded
  // Project, so the denial lives here rather than at the transport edge.
  const membership = await db.member.findFirst({
    where: {
      organizationId: project.organizationId,
      userId,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    throw new ForbiddenError(
      "Only owners and admins can update the Linear link.",
    );
  }

  if (input.kind === "team_change") {
    await db.projectLinearLink.update({
      where: { projectId },
      data: {
        teamId: input.teamId,
        teamKey: input.teamKey,
        teamName: input.teamName,
        defaultStateId: input.defaultStateId,
        defaultLabelIds: input.defaultLabelIds,
        defaultPriority: input.defaultPriority,
        autoCreateIssues: input.autoCreateIssues,
        linkHealthIssue: null,
      },
    });
    return { success: true };
  }

  await db.projectLinearLink.update({
    where: { projectId },
    data: {
      ...(input.defaultStateId !== undefined && {
        defaultStateId: input.defaultStateId,
      }),
      ...(input.defaultLabelIds !== undefined && {
        defaultLabelIds: input.defaultLabelIds,
      }),
      ...(input.defaultPriority !== undefined && {
        defaultPriority: input.defaultPriority,
      }),
      ...(input.autoCreateIssues !== undefined && {
        autoCreateIssues: input.autoCreateIssues,
      }),
      // Successful save clears any stale-ID warning from previous runs.
      linkHealthIssue: null,
    },
  });

  return { success: true };
}
