import { ForbiddenError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { ListInvitationsInput } from "./list-invitations.schema";

export async function listInvitations(
  { organizationId, userId }: ListInvitationsInput & { userId: string },
  db: typeof prisma = prisma,
) {
  // The denial needs the loaded membership and its role, so it belongs here.
  const membership = await db.member.findFirst({
    where: {
      organizationId,
      userId,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    throw new ForbiddenError("You do not have permission to view invitations.");
  }

  return db.invitation.findMany({
    where: {
      organizationId,
      status: "pending",
    },
    orderBy: { createdAt: "desc" },
  });
}

export type ListInvitationsOutput = Awaited<ReturnType<typeof listInvitations>>;
