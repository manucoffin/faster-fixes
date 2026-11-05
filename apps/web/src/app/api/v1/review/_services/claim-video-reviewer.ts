import { ConflictError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { hashReviewerSecret } from "../_helpers/hash-reviewer-secret";

type ClaimVideoReviewerInput = {
  videoId: string;
  projectId: string;
  name: string;
  secret: string;
};

const NAME_TAKEN_MESSAGE =
  "This name is already in use on this video. Choose another one.";

/**
 * Binds a name on a Video to the browser holding `secret`. Claiming a name the
 * same secret already holds returns that Reviewer, so a retried claim is
 * harmless; a name held by another secret throws a `ConflictError`.
 */
export async function claimVideoReviewer({
  videoId,
  projectId,
  name,
  secret,
}: ClaimVideoReviewerInput) {
  const token = hashReviewerSecret(secret);

  const existing = await findReviewerByName(videoId, name);
  if (existing) return heldBy(existing, token);

  try {
    const reviewer = await prisma.reviewer.create({
      data: { projectId, videoId, name, token },
      select: { id: true, name: true },
    });
    return { created: true, reviewer };
  } catch (error) {
    // Two browsers raced for the name: whoever lost reads the winner's row.
    const winner = await findReviewerByName(videoId, name);
    if (winner) return heldBy(winner, token);
    throw error;
  }
}

function findReviewerByName(videoId: string, name: string) {
  return prisma.reviewer.findFirst({
    where: { videoId, name },
    select: { id: true, name: true, token: true },
  });
}

function heldBy(
  reviewer: { id: string; name: string; token: string },
  token: string,
) {
  if (reviewer.token !== token) throw new ConflictError(NAME_TAKEN_MESSAGE);
  return { created: false, reviewer: { id: reviewer.id, name: reviewer.name } };
}
