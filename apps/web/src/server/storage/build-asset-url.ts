type AssetForUrl = {
  key: string;
  provider: string;
  bucket: string;
};

/**
 * Constructs the public URL for an asset from its storage metadata.
 * Extend the switch when adding new storage providers.
 */
export function buildAssetUrl(asset: AssetForUrl): string {
  switch (asset.provider) {
    case "s3":
      return `https://${asset.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${asset.key}`;
    case "r2":
      return `${process.env.NEXT_PUBLIC_STORAGE_BASE_URL}/${asset.key}`;
    default:
      throw new Error(`Unsupported storage provider: ${asset.provider}`);
  }
}
