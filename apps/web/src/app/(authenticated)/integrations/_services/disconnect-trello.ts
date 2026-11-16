import { deleteTrelloBoardWebhooks } from "@/app/_domains/integration/_services/trello/delete-trello-board-webhooks";
import { auth } from "@/server/auth";
import { BadRequestError, ForbiddenError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";

export async function disconnectTrello(
  { headers, userId }: { headers: Headers; userId: string },
  db: typeof prisma = prisma,
) {
  const activeOrganization = await auth.api.getFullOrganization({ headers });

  if (!activeOrganization) {
    throw new BadRequestError("No active organization.");
  }

  // Owner-only, like Jira: disconnecting drops every Project link of the
  // Organization, a heavier action than connecting (which admins may also do).
  const membership = await db.member.findFirst({
    where: {
      organizationId: activeOrganization.id,
      userId,
      role: "owner",
    },
  });

  if (!membership) {
    throw new ForbiddenError(
      "Only the organization owner can disconnect Trello.",
    );
  }

  const installation = await db.trelloInstallation.findUnique({
    where: { organizationId: activeOrganization.id },
    select: {
      healthState: true,
      projectLinks: {
        where: { webhookId: { not: null } },
        select: { webhookId: true },
      },
    },
  });

  // A dead grant cannot remove the webhooks, and Trello already deleted them
  // when the grant was revoked.
  if (installation && installation.healthState !== "reconnect_required") {
    await deleteTrelloBoardWebhooks(
      activeOrganization.id,
      installation.projectLinks.flatMap((link) =>
        link.webhookId ? [link.webhookId] : [],
      ),
    );
  }

  // Trello offers no revocation call for an OAuth 2.0 grant; the member revokes
  // it from their Atlassian account. Dropping the row stops all token use.
  await db.trelloInstallation.deleteMany({
    where: { organizationId: activeOrganization.id },
  });

  return { success: true };
}
