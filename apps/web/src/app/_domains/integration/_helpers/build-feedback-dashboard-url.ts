import { getAuthBaseUrl } from "@/utils/url/get-auth-base-url";

type DashboardFeedback = {
  id: string;
  videoId: string | null;
};

type DashboardUrlOptions = {
  // Opens the Recording player over the Feedback, through the inbox's
  // `player` parameter. A video Feedback has no Recording and ignores it.
  player?: boolean;
};

/**
 * Where a Tracker Issue or a Slack message sends a Member: the Video page at
 * that Feedback for a video Feedback, the inbox otherwise. Never the Share
 * link, which a Member can replace.
 */
export function buildFeedbackDashboardUrl(
  { id, videoId }: DashboardFeedback,
  { player = false }: DashboardUrlOptions = {},
) {
  const baseUrl = getAuthBaseUrl();
  if (videoId !== null) return `${baseUrl}/videos/${videoId}?feedbackId=${id}`;
  if (player) return `${baseUrl}/inbox?feedbackId=${id}&player=true`;
  return `${baseUrl}/inbox?feedbackId=${id}`;
}
