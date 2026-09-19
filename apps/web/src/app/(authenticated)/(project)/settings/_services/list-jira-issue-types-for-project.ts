import { listJiraIssueTypes } from "@/app/_domains/integration/_services/jira/jira-rest-client";
import { getValidJiraAccessToken } from "@/app/_domains/integration/_services/jira/token-access";
import { prisma } from "@workspace/db";
import { getJiraAccess } from "./get-jira-access";
import { ListJiraIssueTypesForProjectInput } from "./list-jira-issue-types-for-project.schema";

export async function listJiraIssueTypesForProject(
  {
    projectId,
    jiraProjectId,
    userId,
  }: ListJiraIssueTypesForProjectInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const { organizationId, installation } = await getJiraAccess(
    { userId, projectId, requireAdmin: false },
    db,
  );

  const accessToken = await getValidJiraAccessToken(organizationId);
  return listJiraIssueTypes(accessToken, installation.cloudId, jiraProjectId);
}

export type ListJiraIssueTypesForProjectOutput = Awaited<
  ReturnType<typeof listJiraIssueTypesForProject>
>;
