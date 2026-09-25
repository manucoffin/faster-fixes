import { BadRequestError } from "@/server/errors/domain-errors";
import { findUnfulfillableRequiredFields } from "@/app/_domains/integration/_services/jira/jira-rest-client";
import { getValidJiraAccessToken } from "@/app/_domains/integration/_services/jira/token-access";
import { registerProjectJiraWebhook } from "@/app/_domains/integration/_services/jira/webhook-registration";
import { prisma } from "@workspace/db";
import { getJiraAccess } from "./get-jira-access";
import type { LinkJiraProjectInput } from "./link-jira-project.schema";

export async function linkJiraProject(
  {
    projectId,
    jiraProjectId,
    jiraProjectKey,
    jiraProjectName,
    issueTypeId,
    issueTypeName,
    autoCreateIssues,
    defaultLabels,
    userId,
  }: LinkJiraProjectInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const { organizationId, installation } = await getJiraAccess(
    {
      userId,
      projectId,
      requireAdmin: true,
      adminDeniedMessage: "Only owners and admins can link Jira projects.",
    },
    db,
  );

  // Checked at link time rather than at issue creation: a required custom field
  // we cannot populate would otherwise turn every mirrored Feedback into a
  // silent 400 from Jira, long after the maintainer left this screen.
  const accessToken = await getValidJiraAccessToken(organizationId);
  const blockingFields = await findUnfulfillableRequiredFields(
    accessToken,
    installation.cloudId,
    jiraProjectId,
    issueTypeId,
  );

  if (blockingFields.length > 0) {
    throw new BadRequestError(
      `This issue type requires fields Faster Fixes cannot fill: ${blockingFields.join(", ")}. Make them optional in Jira, or choose another issue type.`,
    );
  }

  const link = await db.projectJiraLink.upsert({
    where: { projectId },
    update: {
      jiraInstallationId: installation.id,
      jiraProjectId,
      jiraProjectKey,
      jiraProjectName,
      issueTypeId,
      issueTypeName,
      autoCreateIssues,
      defaultLabels,
      linkHealthIssue: null,
    },
    create: {
      projectId,
      jiraInstallationId: installation.id,
      jiraProjectId,
      jiraProjectKey,
      jiraProjectName,
      issueTypeId,
      issueTypeName,
      autoCreateIssues,
      defaultLabels,
    },
  });

  // Inbound status sync is an enhancement, not a precondition for linking: a
  // registration failure (Jira permissions, unreachable callback URL) still
  // leaves outbound mirroring fully working, and the health cron retries.
  try {
    await registerProjectJiraWebhook(link.id);
  } catch (error) {
    console.error(
      `[jira] webhook registration failed for project link ${link.id}`,
      error,
    );
  }

  return { id: link.id };
}
