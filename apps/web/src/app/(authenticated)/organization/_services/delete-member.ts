import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { DeleteMemberInput } from "./delete-member.schema";

export async function deleteMember(
  { memberId, userId }: DeleteMemberInput & { userId: string },
  db: typeof prisma = prisma,
) {
  // The three branches need the loaded Member and the caller's membership in
  // its Organization, so they belong here rather than at the transport edge.
  const member = await db.member.findFirst({
    where: { id: memberId },
  });

  if (!member) {
    throw new NotFoundError("Member not found.");
  }

  const currentUserMembership = await db.member.findFirst({
    where: {
      organizationId: member.organizationId,
      userId,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!currentUserMembership) {
    throw new ForbiddenError(
      "You do not have permission to remove this member.",
    );
  }

  if (member.role === "owner") {
    throw new ForbiddenError("Cannot remove the owner of the organization.");
  }

  await db.member.delete({
    where: { id: memberId },
  });

  return { success: true };
}
