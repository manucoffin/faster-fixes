import type { FeedbackStatus } from "@/app/_domains/feedback";
import type { VideoSelection } from "@/app/_domains/video/_types/video-selection";

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

export type ReviewFeedbackItem = VideoSelection & {
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
