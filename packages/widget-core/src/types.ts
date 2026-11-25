export type WidgetPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left"
  | "middle-right"
  | "middle-left";

export type FeedbackStatus = "new" | "in_progress" | "resolved" | "closed";

export type WidgetConfig = {
  enabled: boolean;
  branding: boolean;
};

export type FeedbackReviewer = {
  id: string;
  name: string;
};

export type FeedbackItem = {
  id: string;
  status: FeedbackStatus;
  comment: string;
  pageUrl: string;
  clickX: number | null;
  clickY: number | null;
  selector: string | null;
  screenshotUrl: string | null;
  reviewer: FeedbackReviewer;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
};

export type FeedbackListResponse = {
  feedback: FeedbackItem[];
};

export type ConsoleLevel = "log" | "info" | "warn" | "error" | "debug";

export type ConsoleEntry = {
  level: ConsoleLevel;
  message: string;
  timestamp: number;
};

export type NetworkEntry = {
  method: string;
  url: string;
  status: number;
  duration: number;
  timestamp: number;
};

export type DiagnosticTrail = {
  console: ConsoleEntry[];
  network: NetworkEntry[];
};

export type CustomMetadataValue = string | number | boolean | null;

// Flat key/value pairs the host site declares; see normalizeCustomMetadata for
// the limits the Widget and the server both apply.
export type CustomMetadata = Record<string, CustomMetadataValue>;

type ViewportRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** The clicked element's box and the click point inside it. */
export type ElementSelectionGeometry = {
  viewport: { width: number; height: number };
  element: ViewportRect;
  click: { x: number; y: number };
};

/** The rectangle the Reviewer dragged; its container is kept in the element fields. */
export type AreaSelectionGeometry = {
  viewport: { width: number; height: number };
  area: ViewportRect;
};

/**
 * Where the Selection sat in the Reviewer's viewport when they made it, in
 * viewport CSS pixels. Stored under the `selection` key of the Feedback
 * metadata so the inbox can draw the Selection frame over the Screenshot.
 * The form is told apart by its content: `element` and `click`, or `area`.
 */
export type SelectionGeometry =
  | ElementSelectionGeometry
  | AreaSelectionGeometry;

export type CreateFeedbackData = {
  comment: string;
  pageUrl: string;
  selector?: string;
  clickX?: number;
  clickY?: number;
  browserName?: string;
  browserVersion?: string;
  os?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  metadata?: Record<string, unknown>;
  diagnosticTrail?: DiagnosticTrail;
  customMetadata?: CustomMetadata;
  /** Declares that a Recording upload follows the creation. */
  recordingFollows?: boolean;
};

/** What travels with a Recording file, beside the gzip body itself. */
export type RecordingDetails = {
  durationMs: number;
  /** The replay format version the Widget wrote the events in. */
  formatVersion: number;
};

export type UpdateFeedbackData = {
  comment: string;
};

export type CreateFeedbackResponse = FeedbackItem;

export type UpdateFeedbackResponse = {
  id: string;
  comment: string;
  updatedAt: string;
};

export type ApiErrorResponse = {
  error: string;
  details?: unknown;
};

/**
 * Common shape implemented by any feedback backend. The default
 * implementation is `FasterFixesClient` (HTTP against the hosted API);
 * alternative implementations can target localStorage, in-memory state,
 * or a mock for tests.
 */
export type FeedbackClient = {
  getConfig(): Promise<WidgetConfig>;
  getFeedback(
    reviewerToken: string,
    url?: string,
  ): Promise<FeedbackListResponse>;
  createFeedback(
    data: CreateFeedbackData,
    reviewerToken: string,
    screenshot?: Blob,
  ): Promise<CreateFeedbackResponse>;
  updateFeedback(
    id: string,
    data: UpdateFeedbackData,
    reviewerToken: string,
  ): Promise<UpdateFeedbackResponse>;
  deleteFeedback(id: string, reviewerToken: string): Promise<void>;
  attachScreenshot(
    feedbackId: string,
    screenshot: Blob,
    reviewerToken: string,
  ): Promise<void>;
  /**
   * Optional so a client injected before Recording existed keeps working: the
   * Widget attaches no Recording when it is absent.
   */
  attachRecording?(
    feedbackId: string,
    recording: Blob,
    details: RecordingDetails,
    reviewerToken: string,
  ): Promise<void>;
};
