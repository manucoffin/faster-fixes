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
  FeedbackClient,
  ConsoleLevel,
  ConsoleEntry,
  NetworkEntry,
  DiagnosticTrail,
} from "./types.js";

export {
  FEEDBACK_STATUSES,
  WIDGET_POSITIONS,
  STATUS_COLORS,
  DEFAULT_API_ORIGIN,
  DEFAULT_WIDGET_COLOR,
  DEFAULT_WIDGET_POSITION,
  DEFAULT_LABELS,
  STORAGE_KEY_TOKEN,
  URL_PARAM_TOKEN,
  DIAGNOSTICS_MAX_ENTRIES,
  DIAGNOSTICS_MAX_MESSAGE_BYTES,
  DIAGNOSTICS_REDACT_PARAMS,
} from "./constants.js";
export type { Labels } from "./constants.js";

export { createDiagnosticsRecorder } from "./diagnostics/recorder.js";
export type {
  DiagnosticsRecorder,
  DiagnosticsRecorderOptions,
} from "./diagnostics/recorder.js";
export { redactUrl } from "./diagnostics/redact.js";

export { resolveReviewerToken } from "./utils/token.js";
export {
  generateSelector,
  generateSelectors,
  resolveElement,
} from "./utils/selector.js";
export type { SelectorStrategies } from "./utils/selector.js";
export { captureElementContext } from "./utils/element-context.js";
export type { ElementContext } from "./utils/element-context.js";
export { getBrowserInfo } from "./utils/browser.js";
