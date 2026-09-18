import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { RevokeAgentTokenInput } from "./revoke-agent-token.schema";

export async function revokeAgentToken(
  {
    organizationId,
    tokenId,
    userId,
  }: RevokeAgentTokenInput & { userId: string },
  db: typeof prisma = prisma,
) {
  // Both branches need loaded rows (the caller's membership, then the token
  // scoped to the Organization), so they belong here.
  const membership = await db.member.findFirst({
    where: {
      organizationId,
      userId,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied.");
  }

  const token = await db.agentToken.findFirst({
    where: { id: tokenId, organizationId },
  });

  if (!token) {
    throw new NotFoundError("Token not found.");
  }

  // Revoking keeps the row so the token stays listed as inactive; deleting
  // removes it entirely.
  await db.agentToken.update({
    where: { id: tokenId },
    data: { isActive: false, revokedAt: new Date() },
  });

  return { id: tokenId };
}
