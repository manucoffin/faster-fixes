import { auth } from "@/server/auth";
import { BadRequestError, ForbiddenError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { CreateInvitationInput } from "./create-invitation.schema";

export async function createInvitation(
  {
    organizationId,
    email,
    role,
    userId,
    headers,
  }: CreateInvitationInput & { userId: string; headers: Headers },
  db: typeof prisma = prisma,
) {
  // The denial needs the loaded membership and its role, so it belongs here.
  // The seat limit is a plan fact and stays on the procedure.
  const membership = await db.member.findFirst({
    where: {
      organizationId,
      userId,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    throw new ForbiddenError("You do not have permission to invite members.");
  }

  try {
    return await auth.api.createInvitation({
      body: { email, role, organizationId },
      headers,
    });
  } catch (error) {
    // Better-Auth reports an already invited member or an invalid address as a
    // plain Error, and its message is the copy the dialog shows.
    if (error instanceof Error) {
      throw new BadRequestError(error.message);
    }

    throw error;
  }
}
