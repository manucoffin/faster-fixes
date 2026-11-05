import type { VideoQuotaDenial } from "@/server/auth/subscription/check-video-quota";

/**
 * Reads the denial the upload route and `completeUpload` send as a JSON
 * message. Any other message, a domain error's sentence for one, gives null.
 */
export function parseVideoQuotaDenial(
  message: string,
): VideoQuotaDenial | null {
  let value: unknown;
  try {
    value = JSON.parse(message);
  } catch {
    return null;
  }

  if (typeof value !== "object" || value === null || !("kind" in value)) {
    return null;
  }

  const denial = value as Record<string, unknown>;
  const hasNumbers = (...keys: string[]) =>
    keys.every((key) => typeof denial[key] === "number");

  switch (denial.kind) {
    case "videoCount":
      return hasNumbers("count", "limit") ? (denial as VideoQuotaDenial) : null;
    case "videoFileSize":
      return hasNumbers("size", "cap") ? (denial as VideoQuotaDenial) : null;
    case "videoStorage":
      return hasNumbers("used", "budget") ? (denial as VideoQuotaDenial) : null;
    default:
      return null;
  }
}
