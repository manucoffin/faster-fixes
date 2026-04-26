export type FeedbackStatus = "new" | "in_progress" | "resolved" | "closed";

export type ListFeedbacksParams = {
  status?: string;
  page_url?: string;
  format?: "json" | "markdown";
};

export type FeedbackJson = {
  id: string;
  status: string;
  comment: string;
  pageUrl: string;
  selector: string | null;
  clickX: number | null;
  clickY: number | null;
  viewportWidth: number | null;
  viewportHeight: number | null;
  browserName: string | null;
  browserVersion: string | null;
  os: string | null;
  screenshotUrl: string | null;
  reviewerName: string;
  createdAt: string;
};

export type ListFeedbacksJsonResponse = {
  feedbacks: FeedbackJson[];
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
