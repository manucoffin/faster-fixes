import { getAppUrl } from "@/utils/url/get-app-url";

export function buildFeedbackDashboardUrl(feedbackId: string): string {
  return `${getAppUrl()}/inbox?feedbackId=${feedbackId}`;
}
