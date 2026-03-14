const S3_BASE_URL = process.env.NEXT_PUBLIC_S3_BASE_URL ?? "";

/**
 * Resolves an S3 key to a full URL.
 * If the value is already an absolute URL, it is returned as-is.
 * Safe to use in client components.
 */
export function resolveS3Url(key: string): string {
  if (key.startsWith("http")) return key;
  return `${S3_BASE_URL}/${key}`;
}
