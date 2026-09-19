import { prisma } from "@workspace/db";
import crypto from "crypto";

/**
 * The active Reviewer the token belongs to in the given Project, or null when
 * the token is absent, unknown or belongs to a deactivated Reviewer. Tokens are
 * stored as SHA-256 hashes, with a plaintext fallback for tokens not yet
 * migrated.
 */
export async function findReviewerByToken(
  token: string | null,
  projectId: string,
) {
  if (!token) return null;

  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const reviewer = await prisma.reviewer.findFirst({
    where: { token: hash, projectId, isActive: true },
  });
  if (reviewer) return reviewer;

  // Fallback: plaintext lookup for tokens not yet migrated — remove after data migration
  return prisma.reviewer.findFirst({
    where: { token, projectId, isActive: true },
  });
}

export type FindReviewerByTokenOutput = Awaited<
  ReturnType<typeof findReviewerByToken>
>;
