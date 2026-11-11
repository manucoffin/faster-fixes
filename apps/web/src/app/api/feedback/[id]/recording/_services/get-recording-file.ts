import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { getStorageObject } from "@/server/storage/objects";
import { prisma } from "@workspace/db";

/**
 * The stored bytes of a Feedback's Recording, for a Member of its
 * Organization. Membership is checked before the Recording, so a non-Member
 * learns nothing about the Feedback from the answer.
 */
export async function getRecordingFile(
  { feedbackId, userId }: { feedbackId: string; userId: string },
  db: typeof prisma = prisma,
) {
  const feedback = await db.feedback.findUnique({
    where: { id: feedbackId },
    select: {
      recording: { select: { key: true } },
      project: { select: { organizationId: true } },
    },
  });

  if (!feedback) {
    throw new NotFoundError("Feedback not found.");
  }

  const membership = await db.member.findFirst({
    where: { organizationId: feedback.project.organizationId, userId },
    select: { id: true },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied.");
  }

  // A Recording that has not reached the server does not exist yet.
  const file = feedback.recording
    ? await getStorageObject(feedback.recording)
    : null;
  if (!file) {
    throw new NotFoundError("Recording not found.");
  }

  return file;
}

export type GetRecordingFileOutput = Awaited<
  ReturnType<typeof getRecordingFile>
>;
