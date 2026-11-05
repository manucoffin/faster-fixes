import type { VideoQuotaDenial } from "@/server/auth/subscription/check-video-quota";
import { formatBytes } from "./format-bytes";

/** The Organization's video usage on cloud, as `video.getUsage` returns it. */
export type VideoUsage = {
  plan: string;
  videoCount: number;
  // null when the Plan has no count limit.
  videoLimit: number | null;
  usedBytes: number;
  budgetBytes: number;
  fileSizeCapBytes: number;
};

/**
 * "1 of 1 video, 320 MB of 500 MB" on a Plan that counts Videos, "4.2 GB of
 * 20 GB of video storage" on one that only has a budget.
 */
export function formatVideoUsageLine(usage: VideoUsage) {
  const storage = `${formatBytes(usage.usedBytes)} of ${formatBytes(usage.budgetBytes)}`;

  if (usage.videoLimit === null) {
    return `${storage} of video storage`;
  }

  const noun = usage.videoLimit === 1 ? "video" : "videos";
  return `${usage.videoCount} of ${usage.videoLimit} ${noun}, ${storage}`;
}

export function isVideoUsageAtLimit(usage: VideoUsage) {
  return (
    (usage.videoLimit !== null && usage.videoCount >= usage.videoLimit) ||
    usage.usedBytes >= usage.budgetBytes
  );
}

/**
 * The sentence for a quota denial, the same whether the dialog computed it
 * before the transfer or the server returned it.
 */
export function formatVideoQuotaDenial(denial: VideoQuotaDenial, plan: string) {
  const planLabel = `The ${plan.charAt(0).toUpperCase()}${plan.slice(1)} plan`;

  switch (denial.kind) {
    case "videoFileSize":
      return `This file is ${formatBytes(denial.size)}. ${planLabel} accepts files up to ${formatBytes(denial.cap)}.`;
    case "videoStorage":
      return `Your organization uses ${formatBytes(denial.used)} of ${formatBytes(denial.budget)} of video storage.`;
    case "videoCount":
      return `${planLabel} includes ${denial.limit === 1 ? "one video" : `${denial.limit} videos`}.`;
  }
}
