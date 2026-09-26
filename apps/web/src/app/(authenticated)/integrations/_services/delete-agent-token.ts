import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { DeleteAgentTokenInput } from "./delete-agent-token.schema";

export async function deleteAgentToken(
  {
    organizationId,
    tokenId,
    userId,
  }: DeleteAgentTokenInput & { userId: string },
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

  await db.agentToken.delete({ where: { id: tokenId } });

  return { id: tokenId };
}
