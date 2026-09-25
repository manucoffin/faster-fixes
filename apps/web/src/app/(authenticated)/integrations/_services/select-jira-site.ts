import { auth } from "@/server/auth";
import { BadRequestError, ForbiddenError } from "@/server/errors/domain-errors";
import { inngest } from "@/server/inngest";
import { getAccessibleResources } from "@/app/_domains/integration/_services/jira/jira-client";
import { getValidJiraAccessToken } from "@/app/_domains/integration/_services/jira/token-access";
import { prisma } from "@workspace/db";
import type { SelectJiraSiteInput } from "./select-jira-site.schema";

export async function selectJiraSite(
  {
    cloudId,
    headers,
    userId,
  }: SelectJiraSiteInput & { headers: Headers; userId: string },
  db: typeof prisma = prisma,
) {
  const activeOrganization = await auth.api.getFullOrganization({ headers });

  if (!activeOrganization) {
    throw new BadRequestError("No active organization.");
  }

  const membership = await db.member.findFirst({
    where: {
      organizationId: activeOrganization.id,
      userId,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    throw new ForbiddenError("Only owners and admins can configure Jira.");
  }

  // Re-fetch accessible resources and resolve the chosen site from them so the
  // stored site URL/name always come from Atlassian, never from client input.
  const accessToken = await getValidJiraAccessToken(activeOrganization.id);
  const resources = await getAccessibleResources(accessToken);
  const site = resources.find((resource) => resource.id === cloudId);

  if (!site) {
    throw new BadRequestError("Selected site is no longer accessible.");
  }

  const installation = await db.jiraInstallation.update({
    where: { organizationId: activeOrganization.id },
    data: {
      cloudId: site.id,
      siteUrl: site.url,
      siteName: site.name,
      healthState: "connected",
      reconnectNotifiedAt: null,
    },
    select: { id: true },
  });

  // This is the second half of the reconnect flow for multi-site grants, so it
  // owes the same webhook renewal the single-site callback does.
  await inngest.send({
    name: "jira/webhooks.refresh-requested",
    data: { installationId: installation.id },
  });

  return { success: true };
}
