import { checkVideoQuota } from "@/server/auth/subscription";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PreconditionFailedError,
} from "@/server/errors/domain-errors";
import { getStorageBucket, getStorageProvider } from "@/server/storage/config";
import {
  deleteStorageObjects,
  headStorageObject,
} from "@/server/storage/objects";
import { prisma } from "@workspace/db";
import {
  getVideoSourceKey,
  isVideoObjectKey,
} from "../_helpers/video-object-keys";
import type { CompleteVideoUploadInput } from "./complete-video-upload.schema";

/**
 * Commits a transfer the browser finished: the size storage reports replaces
 * the declared one and is checked against the Plan again, so a client cannot
 * declare less than it uploaded. A missing object leaves the row in
 * `uploading` for the reaper; a size over a limit removes the object and the
 * row.
 */
export async function completeVideoUpload(
  { videoId, posterKey, userId }: CompleteVideoUploadInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const video = await db.video.findUnique({
    where: { id: videoId },
    select: {
      id: true,
      projectId: true,
      state: true,
      filename: true,
      mimeType: true,
      width: true,
      height: true,
      project: { select: { organizationId: true } },
    },
  });

  if (!video) {
    throw new NotFoundError("Video not found.");
  }

  const membership = await db.member.findFirst({
    where: { organizationId: video.project.organizationId, userId },
    select: { id: true },
  });

  if (!membership) {
    throw new ForbiddenError("You are not a member of this project.");
  }

  if (video.state !== "uploading") {
    throw new ConflictError("This video is already uploaded.");
  }

  if (posterKey !== undefined && !isVideoObjectKey(video, posterKey)) {
    throw new BadRequestError("The poster does not belong to this video.");
  }

  const sourceKey = getVideoSourceKey(video);
  const source = await headStorageObject({ key: sourceKey });

  if (!source) {
    throw new PreconditionFailedError(
      "The video file was not found in storage. Upload it again.",
    );
  }

  const quota = await checkVideoQuota(
    video.project.organizationId,
    source.size,
    db,
    { excludeVideoId: video.id },
  );

  if (!quota.allowed) {
    await deleteUploadedObjects(
      posterKey ? [sourceKey, posterKey] : [sourceKey],
    );
    await db.video.delete({ where: { id: video.id } });
    // Same message shape as the upload route's denial, so the dialog parses
    // both the same way.
    throw new ForbiddenError(JSON.stringify(quota.denial));
  }

  const poster = posterKey ? await findPoster(posterKey) : null;
  const asset = {
    bucket: getStorageBucket(),
    provider: getStorageProvider(),
    uploadedById: userId,
  };

  return db.video.update({
    where: { id: video.id },
    data: {
      state: "ready",
      size: BigInt(source.size),
      fileAsset: {
        create: {
          ...asset,
          key: sourceKey,
          filename: video.filename,
          mimeType: video.mimeType,
          size: BigInt(source.size),
          width: video.width,
          height: video.height,
        },
      },
      ...(poster && {
        posterAsset: {
          create: {
            ...asset,
            key: poster.key,
            filename: "poster.jpg",
            mimeType: "image/jpeg",
            size: BigInt(poster.size),
            width: video.width,
            height: video.height,
          },
        },
      }),
    },
    select: { id: true, state: true, size: true },
  });
}

// Best-effort: the row goes even when storage refuses, and the object is
// orphaned rather than kept counting toward the budget.
async function deleteUploadedObjects(keys: string[]) {
  try {
    const { errors } = await deleteStorageObjects(keys);
    for (const error of errors) {
      console.error(
        `Failed to delete storage object (key=${error.key}): ${error.code} ${error.message}`,
      );
    }
  } catch (error) {
    console.error(`Failed to delete ${keys.length} storage objects:`, error);
  }
}

// A Poster that failed to upload or cannot be read never blocks the Video.
async function findPoster(key: string) {
  try {
    const poster = await headStorageObject({ key });
    return poster && { key, size: poster.size };
  } catch (error) {
    console.error(`Failed to read video poster (key=${key}):`, error);
    return null;
  }
}
