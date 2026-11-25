import { readPageSelection } from "@/app/_domains/feedback/_helpers/read-page-selection";

type Rect = { left: number; top: number; width: number; height: number };
type Viewport = { width: number; height: number };

export type SelectionFrame =
  | {
      /** Width over height of the viewport the Selection was made in. */
      aspectRatio: number;
      element: Rect;
      click: { x: number; y: number };
    }
  | {
      aspectRatio: number;
      /** An area Selection has no click point. */
      area: Rect;
    };

function toPercent(value: number, total: number) {
  return (value / total) * 100;
}

// Null when the rectangle is malformed or misses the viewport; otherwise it is
// clipped to what the Screenshot shows.
function toVisiblePercentRect(rect: Rect, viewport: Viewport) {
  if (rect.width < 0 || rect.height < 0) return null;

  const right = rect.left + rect.width;
  const bottom = rect.top + rect.height;
  const isOutside =
    right <= 0 ||
    bottom <= 0 ||
    rect.left >= viewport.width ||
    rect.top >= viewport.height;
  if (isOutside) return null;

  const left = Math.max(rect.left, 0);
  const top = Math.max(rect.top, 0);
  const visibleRight = Math.min(right, viewport.width);
  const visibleBottom = Math.min(bottom, viewport.height);

  return {
    left: toPercent(left, viewport.width),
    top: toPercent(top, viewport.height),
    width: toPercent(visibleRight - left, viewport.width),
    height: toPercent(visibleBottom - top, viewport.height),
  };
}

/**
 * Reads the Selection geometry from Feedback metadata and returns the Selection
 * frame as percentages of the viewport, so it lands on the same pixels whatever
 * the device pixel ratio or the rendered size of the Screenshot.
 */
export function getSelectionFrame(
  metadata: Record<string, unknown> | null,
): SelectionFrame | null {
  // The frame needs the geometry alone, so the selector does not matter here.
  const selection = readPageSelection({ selector: null, metadata });

  if (selection.form === "area") {
    const { viewport } = selection;
    if (viewport.width <= 0 || viewport.height <= 0) return null;
    // The Widget widens an area to at least 8 by 8, so an empty one is malformed.
    if (selection.area.width <= 0 || selection.area.height <= 0) return null;
    const area = toVisiblePercentRect(selection.area, viewport);
    if (!area) return null;
    return { aspectRatio: viewport.width / viewport.height, area };
  }

  const { geometry } = selection;
  if (!geometry) return null;
  const { viewport, click } = geometry;
  if (viewport.width <= 0 || viewport.height <= 0) return null;

  const element = toVisiblePercentRect(geometry.element, viewport);
  if (!element) return null;

  if (
    click.x < 0 ||
    click.y < 0 ||
    click.x > viewport.width ||
    click.y > viewport.height
  ) {
    return null;
  }

  return {
    aspectRatio: viewport.width / viewport.height,
    element,
    click: {
      x: toPercent(click.x, viewport.width),
      y: toPercent(click.y, viewport.height),
    },
  };
}
