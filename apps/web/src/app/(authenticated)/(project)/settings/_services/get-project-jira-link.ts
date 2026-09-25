import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { GetProjectJiraLinkInput } from "./get-project-jira-link.schema";

export async function getProjectJiraLink(
  { projectId, userId }: GetProjectJiraLinkInput & { userId: string },
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
  // denial lives here rather than at the transport edge. The read deliberately
  // does not go through `getJiraAccess`: the current link must stay readable
  // even when the org-level installation is gone or needs re-authorization.
  const membership = await db.member.findFirst({
    where: { organizationId: project.organizationId, userId },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied.");
  }

  const link = await db.projectJiraLink.findUnique({
    where: { projectId },
    select: {
      id: true,
      jiraProjectId: true,
      jiraProjectKey: true,
      jiraProjectName: true,
      issueTypeId: true,
      issueTypeName: true,
      autoCreateIssues: true,
      defaultLabels: true,
      linkHealthIssue: true,
    },
  });

  return link;
}

export type GetProjectJiraLinkOutput = Awaited<
  ReturnType<typeof getProjectJiraLink>
>;
