import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { DeleteInvitationInput } from "./delete-invitation.schema";

export async function deleteInvitation(
  { invitationId, userId }: DeleteInvitationInput & { userId: string },
  db: typeof prisma = prisma,
) {
  // Both branches need the loaded Invitation and the membership it points to,
  // so they belong here rather than at the transport edge.
  const invitation = await db.invitation.findFirst({
    where: { id: invitationId },
  });

  if (!invitation) {
    throw new NotFoundError("Invitation not found.");
  }

  const membership = await db.member.findFirst({
    where: {
      organizationId: invitation.organizationId,
      userId,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    throw new ForbiddenError(
      "You do not have permission to cancel this invitation.",
    );
  }

  await db.invitation.update({
    where: { id: invitationId },
    data: { status: "canceled" },
  });

  return { success: true };
}
