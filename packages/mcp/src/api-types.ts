export type FeedbackStatus = "new" | "in_progress" | "resolved" | "closed";

export type ListFeedbacksParams = {
  status?: string;
  page_url?: string;
  /** A Video id; exclusive with `page_url`. */
  video?: string;
  format?: "json" | "markdown";
};

type DiagnosticTrailJson = {
  console: Array<{
    level: "log" | "info" | "warn" | "error" | "debug";
    message: string;
    timestamp: number;
  }>;
  network: Array<{
    method: string;
    url: string;
    status: number;
    duration: number;
    timestamp: number;
  }>;
};

/** Coordinates are normalized 0..1 of the frame. */
export type FeedbackSelectionJson = {
  startMs: number;
  /** Null for an instant. */
  endMs: number | null;
  /** At most one of `point` and `area` is set; both null for time only. */
  point: { x: number; y: number } | null;
  area: { x: number; y: number; width: number; height: number } | null;
};

export type FeedbackJson = {
  id: string;
  status: string;
  comment: string;
  /** Null on a page Feedback. */
  videoId: string | null;
  /** Null on a video Feedback. */
  pageUrl: string | null;
  /** Null on a page Feedback. */
  selection: FeedbackSelectionJson | null;
  selector: string | null;
  clickX: number | null;
  clickY: number | null;
  viewportWidth: number | null;
  viewportHeight: number | null;
  browserName: string | null;
  browserVersion: string | null;
  os: string | null;
  screenshotUrl: string | null;
  /** Element context and pin placement, set by the Widget. */
  metadata: Record<string, unknown> | null;
  diagnosticTrail: DiagnosticTrailJson | null;
  /** Key/value pairs declared by the host site at submission. */
  customMetadata: Record<string, string | number | boolean | null> | null;
  reviewerName: string;
  createdAt: string;
};

export type RecordingStepJson = {
  type:
    | "load"
    | "click"
    | "input"
    | "select"
    | "submit"
    | "navigation"
    | "scroll"
    | "resize"
    | "selection";
  /** Epoch ms. */
  timestamp: number;
  /** Negative, relative to `endedAt`. */
  offsetMs: number;
  label: string | null;
  selector: string | null;
  /** A path for a navigation, a size for a resize, the origin of a load. */
  detail: string | null;
};

export type FeedbackRecordingJson = {
  durationMs: number;
  /** Epoch ms; null when the file could not be read. */
  startedAt: number | null;
  /** Epoch ms, the Selection; null when the file could not be read. */
  endedAt: number | null;
  /** Signed, valid one hour. */
  url: string;
  readable: boolean;
  steps: RecordingStepJson[];
};

/** One Feedback in full: the listing's item plus its Recording. */
export type GetFeedbackJsonResponse = FeedbackJson & {
  /** Null when no Recording has reached the server. */
  recording: FeedbackRecordingJson | null;
};

export type VideoBlockJson = {
  id: string;
  title: string;
  filename: string;
  durationMs: number | null;
  width: number | null;
  height: number | null;
};

export type ListFeedbacksJsonResponse = {
  /** Present only when the listing is filtered by `video`. */
  video?: VideoBlockJson;
  feedbacks: FeedbackJson[];
  count: number;
};

export type VideoJson = VideoBlockJson & {
  annotationsOpen: boolean;
  openFeedbackCount: number;
  createdAt: string;
};

export type ListVideosResponse = {
  videos: VideoJson[];
  count: number;
};

export type UpdateStatusResponse = {
  id: string;
  status: string;
  updatedAt: string;
};

export type CreateFeedbackInput = {
  comment: string;
  pageUrl: string;
  status?: FeedbackStatus;
  selector?: string;
  clickX?: number;
  clickY?: number;
  browserName?: string;
  browserVersion?: string;
  os?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  createdAt?: string;
  metadata?: Record<string, unknown>;
};

export type CreateFeedbacksParams = {
  feedbacks: CreateFeedbackInput[];
  reviewerName?: string;
  source?: string;
};

export type CreateFeedbacksResponse = {
  created: number;
  feedbacks: Array<{
    id: string;
    status: string;
    comment: string;
    pageUrl: string;
    createdAt: string;
  }>;
  reviewer: { id: string; name: string };
  atLimit: boolean;
};

export type ApiError = {
  error: string;
  code: string;
};
