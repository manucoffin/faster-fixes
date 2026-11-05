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

/**
 * The Widget list projection extended with the video Selection. The flat
 * frame columns become a `point` when only x and y are set, an `area` when the
 * size is set too, and neither when the Feedback marks no part of the frame.
 */
export function toReviewFeedbackItem(
  row: ReviewFeedbackRow,
  screenshotUrl: string | null,
) {
  const { frameX: x, frameY: y, frameWidth: width, frameHeight: height } = row;
  const hasPosition = x !== null && y !== null;
  const hasSize = width !== null && height !== null;

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
    point: hasPosition && !hasSize ? { x, y } : null,
    area: hasPosition && hasSize ? { x, y, width, height } : null,
  };
}
