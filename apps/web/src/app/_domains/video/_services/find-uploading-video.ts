import { prisma } from "@workspace/db";

/**
 * The Video the caller is still uploading, `null` when it does not exist, is
 * already committed, was reserved by someone else or sits in an Organization
 * the caller is no longer a Member of.
 */
export async function findUploadingVideo({
  videoId,
  userId,
}: {
  videoId: string;
  userId: string;
}) {
  return prisma.video.findFirst({
    where: {
      id: videoId,
      state: "uploading",
      uploadedById: userId,
      project: { organization: { members: { some: { userId } } } },
    },
    select: { id: true, projectId: true },
  });
}

export type FindUploadingVideoOutput = Awaited<
  ReturnType<typeof findUploadingVideo>
>;
