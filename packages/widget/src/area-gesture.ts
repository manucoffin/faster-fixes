import { clamp } from "./pin-placement.js";
import type { PinPoint } from "./pin-placement.js";

/** A rectangle of the viewport, in viewport CSS pixels. */
export type AreaRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type ViewportSize = { width: number; height: number };

// Below this travel from the press, the gesture is a click on an element.
const DRAG_THRESHOLD_PX = 6;
// A shorter side is widened, so an area is never an invisible line.
const MIN_AREA_SIDE_PX = 8;

export function isDrag(press: PinPoint, point: PinPoint) {
  return Math.hypot(point.x - press.x, point.y - press.y) >= DRAG_THRESHOLD_PX;
}

function readSpan(from: number, to: number, size: number) {
  const start = clamp(Math.min(from, to), 0, size);
  const end = clamp(Math.max(from, to), 0, size);
  const length = Math.min(Math.max(end - start, MIN_AREA_SIDE_PX), size);
  return { start: clamp(start, 0, size - length), length };
}

/**
 * The area between the press and the pointer, clamped to the viewport and at
 * least `MIN_AREA_SIDE_PX` on each side.
 */
export function readAreaRect(
  press: PinPoint,
  point: PinPoint,
  viewport: ViewportSize,
): AreaRect {
  const x = readSpan(press.x, point.x, viewport.width);
  const y = readSpan(press.y, point.y, viewport.height);
  return { left: x.start, top: y.start, width: x.length, height: y.length };
}
