import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { LeaveOrganizationInput } from "./leave-organization.schema";

export async function leaveOrganization(
  { organizationId, userId }: LeaveOrganizationInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const membership = await db.member.findFirst({
    where: {
      organizationId,
      userId,
    },
  });

  // Both denials need the loaded membership, so they belong here rather than
  // at the transport edge.
  if (!membership) {
    throw new NotFoundError("You are not a member of this organization.");
  }

  if (membership.role === "owner") {
    throw new ForbiddenError(
      "The owner cannot leave the organization. Transfer ownership or delete the organization.",
    );
  }

  await db.member.delete({
    where: { id: membership.id },
  });

  return { success: true };
}
