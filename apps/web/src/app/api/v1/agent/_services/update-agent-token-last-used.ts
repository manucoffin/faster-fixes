import { prisma } from "@workspace/db";

/**
 * Stamps an Agent token with the moment it was last accepted.
 *
 * Split out of `find-agent-token.ts` so the lookup keeps the promise its `find-`
 * prefix makes. The caller fires it without awaiting: the stamp is usage
 * telemetry, so a failed write must not fail an authenticated request.
 */
export function updateAgentTokenLastUsed(id: string) {
  return prisma.agentToken.update({
    where: { id },
    data: { lastUsedAt: new Date() },
  });
}
