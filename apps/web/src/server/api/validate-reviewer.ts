import { prisma } from "@workspace/db";
import crypto from "crypto";

/**
 * Validates that a reviewer token belongs to an active reviewer in the given project.
 * Tokens are stored as SHA-256 hashes. During migration, plaintext fallback is supported.
 * Returns the reviewer record or null if invalid/inactive.
 */
export async function validateReviewer(
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
