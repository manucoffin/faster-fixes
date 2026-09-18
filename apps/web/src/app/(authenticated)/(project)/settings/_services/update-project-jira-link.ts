import { NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { getJiraAccess } from "./get-jira-access";
import { UpdateProjectJiraLinkInput } from "./update-project-jira-link.schema";

export async function updateProjectJiraLink(
  {
    projectId,
    autoCreateIssues,
    defaultLabels,
    userId,
  }: UpdateProjectJiraLinkInput & { userId: string },
  db: typeof prisma = prisma,
) {
  await getJiraAccess(
    {
      userId,
      projectId,
      requireAdmin: true,
      adminDeniedMessage:
        "Only owners and admins can change Jira link settings.",
    },
    db,
  );

  const link = await db.projectJiraLink.findUnique({
    where: { projectId },
    select: { id: true },
  });

  if (!link) {
    throw new NotFoundError("This project is not linked to a Jira project.");
  }

  await db.projectJiraLink.update({
    where: { id: link.id },
    data: {
      ...(autoCreateIssues !== undefined && { autoCreateIssues }),
      ...(defaultLabels !== undefined && { defaultLabels }),
    },
  });

  return { success: true };
}
