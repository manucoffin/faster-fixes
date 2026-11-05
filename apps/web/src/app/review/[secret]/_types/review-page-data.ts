import type { FeedbackStatus } from "@/app/_domains/feedback";

export type ReviewVideo = {
  id: string;
  title: string;
  durationMs: number | null;
  width: number | null;
  height: number | null;
  annotationsOpen: boolean;
  playbackUrl: string;
  posterUrl: string | null;
};

/** Where on the frame a Feedback points, normalized 0..1 to the Video. */
export type ReviewSelection = {
  point: { x: number; y: number } | null;
  area: { x: number; y: number; width: number; height: number } | null;
};

export type ReviewFeedbackItem = ReviewSelection & {
  id: string;
  status: FeedbackStatus;
  comment: string;
  screenshotUrl: string | null;
  reviewer: { id: string; name: string };
  createdAt: string;
  startMs: number;
  endMs: number | null;
};

/** The body of `GET /api/v1/review/{secret}`, as the review page reads it. */
export type ReviewPageData = {
  video: ReviewVideo;
  feedback: ReviewFeedbackItem[];
  reviewer: { id: string; name: string } | null;
};
