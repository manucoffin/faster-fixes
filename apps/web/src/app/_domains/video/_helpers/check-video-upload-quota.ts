import type { VideoQuotaDenial } from "@/server/auth/subscription/check-video-quota";
import type { VideoUsage } from "./format-video-usage";

/**
 * The upload dialog's copy of the server's quota check, run before the
 * transfer on the usage the list already loaded. Same order as the server, so
 * a file both too large and over budget reads the same either side.
 */
export function checkVideoUploadQuota(
  usage: VideoUsage,
  fileSize: number,
): VideoQuotaDenial | null {
  if (fileSize > usage.fileSizeCapBytes) {
    return {
      kind: "videoFileSize",
      size: fileSize,
      cap: usage.fileSizeCapBytes,
    };
  }

  if (usage.videoLimit !== null && usage.videoCount >= usage.videoLimit) {
    return {
      kind: "videoCount",
      count: usage.videoCount,
      limit: usage.videoLimit,
    };
  }

  if (usage.usedBytes + fileSize > usage.budgetBytes) {
    return {
      kind: "videoStorage",
      used: usage.usedBytes,
      budget: usage.budgetBytes,
    };
  }

  return null;
}
