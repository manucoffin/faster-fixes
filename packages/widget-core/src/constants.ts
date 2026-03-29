import type { FeedbackStatus, WidgetPosition } from "./types.js";

export const FEEDBACK_STATUSES: FeedbackStatus[] = [
  "new",
  "in_progress",
  "resolved",
  "closed",
];

export const WIDGET_POSITIONS: WidgetPosition[] = [
  "bottom-right",
  "bottom-left",
  "top-right",
  "top-left",
  "middle-right",
  "middle-left",
];

export const STATUS_COLORS: Record<FeedbackStatus, string> = {
  new: "#ef4444",
  in_progress: "#f59e0b",
  resolved: "#22c55e",
  closed: "#6b7280",
};

export const DEFAULT_API_ORIGIN = "https://www.faster-fixes.com";

export const DEFAULT_WIDGET_COLOR = "#02527E";
export const DEFAULT_WIDGET_POSITION: WidgetPosition = "bottom-right";

export const DEFAULT_LABELS = {
  submitButton: "Submit",
  cancelButton: "Cancel",
  textareaPlaceholder: "Describe the issue...",
  successMessage: "Feedback sent",
  closeButton: "Close",
  retryButton: "Retry",
  errorMessage: "Something went wrong",
  deleteConfirm: "Delete this feedback?",
  deleteButton: "Delete",
  editButton: "Edit",
  saveButton: "Save",
  showResolved: "Show resolved",
  hideResolved: "Hide resolved",
  feedbackListTitle: "Feedback",
  emptyList: "No feedback on this page",
} as const;

export type Labels = typeof DEFAULT_LABELS;

export const STORAGE_KEY_TOKEN = "ff_reviewer_token";
export const URL_PARAM_TOKEN = "ff_token";
