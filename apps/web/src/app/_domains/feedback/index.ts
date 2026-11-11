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
export { formatTimelineLines } from "./_helpers/format-timeline-lines";
export {
  mergeRecordingTimeline,
  RECORDING_TIMELINE_MAX_ENTRIES,
  type RecordingTimeline,
} from "./_helpers/merge-recording-timeline";
export {
  type CachedRecordingSteps,
  readCachedRecordingSteps,
} from "./_helpers/read-cached-recording-steps";
export { RECORDING_MAX_DECOMPRESSED_BYTES } from "./_helpers/recording-format";
export {
  RECORDING_STEPS_VERSION,
  readRecordingSteps,
} from "./_helpers/read-recording-steps";
