import { s3Client } from "@/server/storage";
import { deleteObjects } from "@better-upload/server/helpers";
import { prisma } from "@workspace/db";

// S3 accepts at most 1000 keys in one DeleteObjects request.
const DELETE_BATCH_SIZE = 1000;

/**
 * Deletes many Assets: removes their objects from S3 (best-effort) then deletes
 * the DB records. The batched form of `deleteAsset`, for a cascade that frees a
 * whole Project's screenshots in a handful of requests instead of one per Asset.
 */
export async function deleteAssets(assetIds: string[]) {
  for (let start = 0; start < assetIds.length; start += DELETE_BATCH_SIZE) {
    const batchIds = assetIds.slice(start, start + DELETE_BATCH_SIZE);
    const assets = await prisma.asset.findMany({
      where: { id: { in: batchIds } },
      select: { id: true, key: true, bucket: true },
    });

    const keysByBucket = new Map<string, string[]>();
    for (const asset of assets) {
      keysByBucket.set(asset.bucket, [
        ...(keysByBucket.get(asset.bucket) ?? []),
        asset.key,
      ]);
    }

    for (const [bucket, keys] of keysByBucket) {
      try {
        const { errors } = await deleteObjects(s3Client, {
          bucket,
          objects: keys.map((key) => ({ key })),
          quiet: true,
        });
        for (const error of errors) {
          console.error(
            `Failed to delete S3 object (key=${error.key}): ${error.code} ${error.message}`,
          );
        }
      } catch (error) {
        console.error(
          `Failed to delete ${keys.length} S3 objects (bucket=${bucket}):`,
          error,
        );
      }
    }

    await prisma.asset.deleteMany({
      where: { id: { in: assets.map((asset) => asset.id) } },
    });
  }
}
