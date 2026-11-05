import { readVideoSelection, type VideoSelection } from "@/app/_domains/video";

export type FeedbackSelection = VideoSelection & {
  startMs: number;
  /** Null for an instant. */
  endMs: number | null;
};

type SelectionColumns = {
  videoId: string | null;
  startMs: number | null;
  endMs: number | null;
  frameX: number | null;
  frameY: number | null;
  frameWidth: number | null;
  frameHeight: number | null;
};

/** The typed Selection of a video Feedback's flat columns; null on a page Feedback. */
export function readFeedbackSelection(
  f: SelectionColumns,
): FeedbackSelection | null {
  if (f.videoId === null || f.startMs === null) return null;
  return { startMs: f.startMs, endMs: f.endMs, ...readVideoSelection(f) };
}
