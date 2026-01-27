import { getPayload } from "payload";
import config from "./config";

let cachedPayload: Awaited<ReturnType<typeof getPayload>> | null = null;

/**
 * Get Payload CMS instance with lazy initialization.
 * Only initializes when actually needed, preventing esbuild/drizzle-kit
 * from being bundled and parsed during build/dev startup.
 */
export async function getPayloadClient() {
  if (!cachedPayload) {
    cachedPayload = await getPayload({ config });
  }
  return cachedPayload;
}
