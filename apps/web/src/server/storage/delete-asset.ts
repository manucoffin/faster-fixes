import { s3Client } from "@/server/storage";
import { deleteObject } from "@better-upload/server/helpers";
import { prisma } from "@workspace/db";

/**
 * Deletes an Asset: removes the object from S3 (best-effort) then deletes the DB record.
 * Safe to call even if the S3 object is already gone.
 */
export async function deleteAsset(assetId: string) {
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { id: true, key: true, bucket: true },
  });

  if (!asset) return;

  try {
    await deleteObject(s3Client, {
      bucket: asset.bucket,
      key: asset.key,
    });
  } catch (error) {
    console.error(`Failed to delete S3 object (key=${asset.key}):`, error);
  }

  await prisma.asset.delete({ where: { id: asset.id } });
}
