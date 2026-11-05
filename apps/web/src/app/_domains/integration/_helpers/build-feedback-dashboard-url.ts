import { getAuthBaseUrl } from "@/utils/url/get-auth-base-url";

type DashboardFeedback = {
  id: string;
  videoId: string | null;
};

/**
 * Where a Tracker Issue or a Slack message sends a Member: the Video page at
 * that Feedback for a video Feedback, the inbox otherwise. Never the Share
 * link, which a Member can replace.
 */
export function buildFeedbackDashboardUrl({ id, videoId }: DashboardFeedback) {
  const baseUrl = getAuthBaseUrl();
  if (videoId !== null) return `${baseUrl}/videos/${videoId}?feedbackId=${id}`;
  return `${baseUrl}/inbox?feedbackId=${id}`;
}
