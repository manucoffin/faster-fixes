import { presignGetObject } from "@better-upload/server/helpers";
import { s3Client } from "@/server/storage";

type AssetForSignedUrl = {
  key: string;
  bucket: string;
};

export async function getSignedAssetUrl(
  asset: AssetForSignedUrl,
  expiresIn = 3600,
): Promise<string> {
  return presignGetObject(s3Client, {
    bucket: asset.bucket,
    key: asset.key,
    expiresIn,
  });
}
