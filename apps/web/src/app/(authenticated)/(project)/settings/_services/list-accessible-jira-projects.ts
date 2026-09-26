import { listJiraProjects } from "@/app/_domains/integration/_services/jira/jira-rest-client";
import { getValidJiraAccessToken } from "@/app/_domains/integration/_services/jira/token-access";
import { prisma } from "@workspace/db";
import { getJiraAccess } from "./get-jira-access";
import type { ListAccessibleJiraProjectsInput } from "./list-accessible-jira-projects.schema";

export async function listAccessibleJiraProjects(
  { projectId, userId }: ListAccessibleJiraProjectsInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const { organizationId, installation } = await getJiraAccess(
    { userId, projectId, requireAdmin: false },
    db,
  );

  const accessToken = await getValidJiraAccessToken(organizationId);
  return listJiraProjects(accessToken, installation.cloudId);
}

export type ListAccessibleJiraProjectsOutput = Awaited<
  ReturnType<typeof listAccessibleJiraProjects>
>;
