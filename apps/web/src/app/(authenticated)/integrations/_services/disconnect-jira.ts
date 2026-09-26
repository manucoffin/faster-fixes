import { auth } from "@/server/auth";
import { BadRequestError, ForbiddenError } from "@/server/errors/domain-errors";
import { deregisterProjectJiraWebhook } from "@/app/_domains/integration/_services/jira/webhook-registration";
import { prisma } from "@workspace/db";

export async function disconnectJira(
  { headers, userId }: { headers: Headers; userId: string },
  db: typeof prisma = prisma,
) {
  const activeOrganization = await auth.api.getFullOrganization({ headers });

  if (!activeOrganization) {
    throw new BadRequestError("No active organization.");
  }

  // Owner-only per ADR 0008: disconnecting drops the org's only Jira link, a
  // heavier action than installing (which admins may also do).
  const membership = await db.member.findFirst({
    where: {
      organizationId: activeOrganization.id,
      userId,
      role: "owner",
    },
  });

  if (!membership) {
    throw new ForbiddenError(
      "Only the organization owner can disconnect Jira.",
    );
  }

  // Deleting the installation cascades the Project links away, taking with them
  // the only record of what to deregister — so the Jira-side webhooks go first,
  // while the credentials to remove them still exist.
  const links = await db.projectJiraLink.findMany({
    where: { jiraInstallation: { organizationId: activeOrganization.id } },
    include: { jiraInstallation: true },
  });

  for (const link of links) {
    await deregisterProjectJiraWebhook(link);
  }

  // Atlassian has no public 3LO token-revocation endpoint; the user revokes
  // access from their Atlassian account's connected apps. We drop the local
  // installation, which stops all further token use.
  await db.jiraInstallation.deleteMany({
    where: { organizationId: activeOrganization.id },
  });

  return { success: true };
}
