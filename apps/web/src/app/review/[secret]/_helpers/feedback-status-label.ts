import type { FeedbackStatus } from "@/app/_domains/feedback";

// The dashboard's labels: the stored "closed" reads as "Archived".
const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: "New",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Archived",
};

export function getFeedbackStatusLabel(status: FeedbackStatus) {
  return FEEDBACK_STATUS_LABELS[status];
}
