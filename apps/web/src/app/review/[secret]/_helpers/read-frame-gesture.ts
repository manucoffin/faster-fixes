import type { ReviewSelection } from "../_types/review-page-data";

type Size = { width: number; height: number };
type Fraction = { x: number; y: number };

// Below this travel, in frame fractions, a press is a click, not a drag.
const DRAG_THRESHOLD = 0.015;
// A drag along one axis still outlines a visible strip.
const MIN_AREA_SIZE = 0.01;

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

/**
 * Maps a position in the box showing the frame letterboxed (`object-contain`)
 * back to the frame, clamped to it: the inverse of `mapSelectionToBox`.
 */
export function toFramePosition(
  boxPosition: Fraction,
  frame: Size,
  box: Size,
): Fraction {
  const scale = Math.min(box.width / frame.width, box.height / frame.height);
  const frameWidth = (frame.width * scale) / box.width;
  const frameHeight = (frame.height * scale) / box.height;
  return {
    x: clamp((boxPosition.x - (1 - frameWidth) / 2) / frameWidth),
    y: clamp((boxPosition.y - (1 - frameHeight) / 2) / frameHeight),
  };
}

// The schema checks `offset + size <= 1` in floating point, which a size of
// exactly `1 - offset` can miss by one unit in the last place.
function fitInside(offset: number, size: number) {
  const fitted = Math.min(size, 1 - offset);
  return offset + fitted > 1 ? fitted - Number.EPSILON : fitted;
}

function toSpan(from: number, to: number) {
  const start = Math.min(Math.min(from, to), 1 - MIN_AREA_SIZE);
  const size = Math.max(Math.abs(to - from), MIN_AREA_SIZE);
  return { start, size: fitInside(start, size) };
}

/**
 * Reads a press on the frame, from where it went down to where it came up:
 * a click places a point, a drag outlines the area it spans, kept inside the
 * frame.
 */
export function readFrameGesture(start: Fraction, end: Fraction) {
  const travel = Math.hypot(end.x - start.x, end.y - start.y);
  if (travel < DRAG_THRESHOLD) {
    return { point: start, area: null } satisfies ReviewSelection;
  }

  const horizontal = toSpan(start.x, end.x);
  const vertical = toSpan(start.y, end.y);
  return {
    point: null,
    area: {
      x: horizontal.start,
      y: vertical.start,
      width: horizontal.size,
      height: vertical.size,
    },
  } satisfies ReviewSelection;
}

/** The marker kind the composer shows beside the time, or null without one. */
export function describeFrameMarker(selection: ReviewSelection) {
  if (selection.area) return "Area outlined";
  if (selection.point) return "Point placed";
  return null;
}
