import { prisma } from "@workspace/db";
import crypto from "crypto";

const TOKEN_PREFIX = "ff_agent_";

/**
 * The agent token carried by an `Authorization: Bearer` header with the
 * Organization it belongs to, `null` when the header is absent, malformed,
 * unknown or revoked.
 */
export async function findAgentToken(authHeader: string | null) {
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(ff_agent_.+)$/);
  if (!match?.[1]) return null;

  const rawToken = match[1];
  if (!rawToken.startsWith(TOKEN_PREFIX)) return null;

  const computedHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const agentToken = await prisma.agentToken.findFirst({
    where: { tokenHash: computedHash, isActive: true, revokedAt: null },
    include: {
      organization: {
        select: {
          id: true,
          projects: { select: { id: true, publicId: true } },
        },
      },
    },
  });

  if (!agentToken) return null;

  // Defense in depth: constant-time comparison
  const storedBuf = Buffer.from(agentToken.tokenHash, "hex");
  const computedBuf = Buffer.from(computedHash, "hex");
  if (
    storedBuf.length !== computedBuf.length ||
    !crypto.timingSafeEqual(storedBuf, computedBuf)
  ) {
    return null;
  }

  return agentToken;
}

export type FindAgentTokenOutput = Awaited<ReturnType<typeof findAgentToken>>;

/** The same token, narrowed to the authenticated case. */
export type AuthenticatedAgentToken = NonNullable<FindAgentTokenOutput>;
