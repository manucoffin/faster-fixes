import { deleteStorageObjects } from "@/server/storage/objects";
import { prisma } from "@workspace/db";
import {
  getVideoPosterKey,
  getVideoSourceKey,
} from "../_helpers/video-object-keys";

const ABANDONED_AFTER_MS = 24 * 60 * 60 * 1000;

// Two keys per Video keeps one run inside S3's 1000-key DeleteObjects cap; a
// larger backlog drains over the following hourly runs.
const BATCH_SIZE = 500;

/**
 * Deletes Videos left in `uploading` for more than a day (a closed tab, a
 * transfer that never committed) with their source and Poster objects, so
 * they stop counting toward the Organization's budget. Storage is
 * best-effort: the rows go even when an object cannot be removed.
 */
export async function deleteAbandonedVideoUploads(
  now: Date,
  db: typeof prisma = prisma,
) {
  const where = {
    state: "uploading",
    createdAt: { lte: new Date(now.getTime() - ABANDONED_AFTER_MS) },
  };

  const videos = await db.video.findMany({
    where,
    select: { id: true, projectId: true, mimeType: true },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });

  if (videos.length === 0) return { deleted: 0 };

  const ids = videos.map((video) => video.id);
  // Re-applies the filter so a Video committed since the read is kept, and
  // its objects with it.
  const { count } = await db.video.deleteMany({
    where: { ...where, id: { in: ids } },
  });
  const kept = await db.video.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  const keptIds = new Set(kept.map((video) => video.id));

  await deleteObjects(
    videos
      .filter((video) => !keptIds.has(video.id))
      .flatMap((video) => [getVideoSourceKey(video), getVideoPosterKey(video)]),
  );

  return { deleted: count };
}

async function deleteObjects(keys: string[]) {
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
