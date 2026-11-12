import { deleteStorageObject } from "./objects";
import { prisma } from "@workspace/db";

/**
 * Deletes an Asset: removes the object from storage (best-effort) then deletes the DB record.
 * Safe to call even if the stored object is already gone.
 */
export async function deleteAsset(assetId: string, db: typeof prisma = prisma) {
  const asset = await db.asset.findUnique({
    where: { id: assetId },
    select: { id: true, key: true },
  });

  if (!asset) return;

  try {
    await deleteStorageObject(asset);
  } catch (error) {
    console.error(`Failed to delete storage object (key=${asset.key}):`, error);
  }

  await db.asset.delete({ where: { id: asset.id } });
}
