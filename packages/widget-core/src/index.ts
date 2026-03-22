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
export { generateSelector, generateSelectors, resolveElement } from "./utils/selector.js";
export type { SelectorStrategies } from "./utils/selector.js";
export { captureElementContext } from "./utils/element-context.js";
export type { ElementContext } from "./utils/element-context.js";
export { getBrowserInfo } from "./utils/browser.js";
