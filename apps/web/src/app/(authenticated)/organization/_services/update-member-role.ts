import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { UpdateMemberRoleInput } from "./update-member-role.schema";

export async function updateMemberRole(
  { memberId, role, userId }: UpdateMemberRoleInput & { userId: string },
  db: typeof prisma = prisma,
) {
  // Both branches need the loaded Member and the caller's role in its
  // Organization, so they belong here rather than at the transport edge.
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
      role: "owner",
    },
  });

  if (!currentUserMembership) {
    throw new ForbiddenError("Only the owner can change member roles.");
  }

  const updated = await db.member.update({
    where: { id: memberId },
    data: { role },
  });

  return { id: updated.id, role: updated.role };
}
