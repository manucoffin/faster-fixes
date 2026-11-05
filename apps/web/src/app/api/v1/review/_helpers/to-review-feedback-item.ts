import { readVideoSelection } from "@/app/_domains/video/_helpers/read-video-selection";

/** The Feedback fields every review route reads back for the list projection. */
export const reviewFeedbackSelect = {
  id: true,
  status: true,
  comment: true,
  pageUrl: true,
  clickX: true,
  clickY: true,
  selector: true,
  metadata: true,
  createdAt: true,
  startMs: true,
  endMs: true,
  frameX: true,
  frameY: true,
  frameWidth: true,
  frameHeight: true,
  reviewer: { select: { id: true, name: true } },
  screenshot: { select: { key: true } },
} as const;

type ReviewFeedbackRow = {
  id: string;
  status: string;
  comment: string;
  pageUrl: string | null;
  clickX: number | null;
  clickY: number | null;
  selector: string | null;
  metadata: unknown;
  createdAt: Date;
  startMs: number | null;
  endMs: number | null;
  frameX: number | null;
  frameY: number | null;
  frameWidth: number | null;
  frameHeight: number | null;
  reviewer: { id: string; name: string };
};

/** The Widget list projection extended with the video Selection. */
export function toReviewFeedbackItem(
  row: ReviewFeedbackRow,
  screenshotUrl: string | null,
) {
  return {
    id: row.id,
    status: row.status,
    comment: row.comment,
    pageUrl: row.pageUrl,
    clickX: row.clickX,
    clickY: row.clickY,
    selector: row.selector,
    screenshotUrl,
    metadata: row.metadata,
    reviewer: row.reviewer,
    createdAt: row.createdAt,
    startMs: row.startMs,
    endMs: row.endMs,
    ...readVideoSelection(row),
  };
}
