export { FasterFixesClient, ApiError } from "./client.js";
export type { ClientOptions } from "./client.js";

export type {
  WidgetConfig,
  WidgetPosition,
  FeedbackStatus,
  FeedbackItem,
  FeedbackReviewer,
  FeedbackListResponse,
  CreateFeedbackData,
  UpdateFeedbackData,
  CreateFeedbackResponse,
  UpdateFeedbackResponse,
  ApiErrorResponse,
} from "./types.js";

export {
  FEEDBACK_STATUSES,
  WIDGET_POSITIONS,
  STATUS_COLORS,
  DEFAULT_API_ORIGIN,
  DEFAULT_LABELS,
  STORAGE_KEY_TOKEN,
  URL_PARAM_TOKEN,
} from "./constants.js";
export type { Labels } from "./constants.js";

export { resolveReviewerToken } from "./utils/token.js";
export { generateSelector } from "./utils/selector.js";
export { getBrowserInfo } from "./utils/browser.js";
