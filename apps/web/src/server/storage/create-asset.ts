import { prisma } from "@workspace/db";
import { Prisma } from "@workspace/db/generated/prisma/client";

type CreateAssetInput = {
  key: string;
  bucket: string;
  provider: string;
  filename: string;
  mimeType: string;
  /** File size in bytes */
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  metadata?: Prisma.InputJsonValue;
  uploadedById?: string;
};

/**
 * Creates an Asset DB record after a file has been successfully uploaded to storage.
 * Call this from tRPC mutations or server actions once the presigned-URL upload completes.
 */
export async function createAsset(input: CreateAssetInput) {
  return prisma.asset.create({ data: input });
}
