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

  // Trello offers no revocation call for an OAuth 2.0 grant; the member revokes
  // it from their Atlassian account. Dropping the row stops all token use.
  await db.trelloInstallation.deleteMany({
    where: { organizationId: activeOrganization.id },
  });

  return { success: true };
}
