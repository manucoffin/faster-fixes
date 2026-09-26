const STORAGE_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_BASE_URL ?? "";

/**
 * Resolves an S3 key to a full URL.
 * If the value is already an absolute URL, it is returned as-is.
 *
 * Reads a public environment variable and does no IO, so it lives here rather
 * than in the server folder: nine client components render asset URLs with it.
 */
export function resolveS3Url(key: string): string {
  if (key.startsWith("http")) return key;
  return `${STORAGE_BASE_URL}/${key}`;
}
