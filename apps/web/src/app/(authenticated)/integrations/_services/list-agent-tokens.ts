import { ForbiddenError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { ListAgentTokensInput } from "./list-agent-tokens.schema";

export async function listAgentTokens(
  { organizationId, userId }: ListAgentTokensInput & { userId: string },
  db: typeof prisma = prisma,
) {
  // The denial needs the loaded membership, so it belongs here rather than at
  // the transport edge. Any member may read the tokens; only owners and admins
  // may write them.
  const membership = await db.member.findFirst({
    where: {
      organizationId,
      userId,
    },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied.");
  }

  return db.agentToken.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      tokenLastFour: true,
      scopes: true,
      isActive: true,
      lastUsedAt: true,
      createdAt: true,
      revokedAt: true,
    },
  });
}

export type ListAgentTokensOutput = Awaited<ReturnType<typeof listAgentTokens>>;
