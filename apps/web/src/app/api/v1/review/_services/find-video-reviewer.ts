import { prisma } from "@workspace/db";
import { hashReviewerSecret } from "../_helpers/hash-reviewer-secret";

/**
 * The Reviewer of this Video the browser-held secret belongs to, or null when
 * the secret is absent or matches no active Reviewer of the Video. Each route
 * decides whether a missing Reviewer is an error.
 */
export async function findVideoReviewer(
  secret: string | null,
  videoId: string,
) {
  if (!secret) return null;

  return prisma.reviewer.findFirst({
    where: { videoId, token: hashReviewerSecret(secret), isActive: true },
    select: { id: true, name: true },
  });
}

export type FindVideoReviewerOutput = Awaited<
  ReturnType<typeof findVideoReviewer>
>;
