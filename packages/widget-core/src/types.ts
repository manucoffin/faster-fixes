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
