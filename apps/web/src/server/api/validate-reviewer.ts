import { prisma } from "@workspace/db";

/**
 * Validates that a reviewer token belongs to an active reviewer in the given project.
 * Returns the reviewer record or null if invalid/inactive.
 */
export async function validateReviewer(
  token: string | null,
  projectId: string,
) {
  if (!token) return null;
  return prisma.reviewer.findFirst({
    where: { token, projectId, isActive: true },
  });
}
