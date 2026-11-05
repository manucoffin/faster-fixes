// Public surface of the feedback domain.
export {
  FeedbackStatusEnum,
  OPEN_FEEDBACK_STATUSES,
} from "./_helpers/feedback-status";
export type { FeedbackStatus } from "./_types/feedback-status";
export {
  formatCustomMetadataLines,
  formatDiagnosticTrailLines,
} from "./_helpers/format-feedback-markdown";
