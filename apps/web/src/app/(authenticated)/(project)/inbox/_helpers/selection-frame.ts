import type { SelectionGeometry } from "@fasterfixes/core";

export type SelectionFrame = {
  element: { left: number; top: number; width: number; height: number };
  click: { x: number; y: number };
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function readNumbers<K extends string>(value: unknown, keys: readonly K[]) {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const numbers = {} as Record<K, number>;
  for (const key of keys) {
    const entry = record[key];
    if (!isFiniteNumber(entry)) return null;
    numbers[key] = entry;
  }
  return numbers;
}

// Metadata is untyped JSON written by the widget, so every field is checked.
function readSelectionGeometry(value: unknown): SelectionGeometry | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const viewport = readNumbers(record.viewport, ["width", "height"] as const);
  const element = readNumbers(record.element, [
    "left",
    "top",
    "width",
    "height",
  ] as const);
  const click = readNumbers(record.click, ["x", "y"] as const);
  if (!viewport || !element || !click) return null;
  return { viewport, element, click };
}

function toPercent(value: number, total: number) {
  return (value / total) * 100;
}

/**
 * Reads the Selection geometry from Feedback metadata and returns the Selection
 * frame as percentages of the viewport, so it lands on the same pixels whatever
 * the device pixel ratio or the rendered size of the Screenshot.
 */
export function getSelectionFrame(
  metadata: Record<string, unknown> | null,
): SelectionFrame | null {
  const geometry = readSelectionGeometry(metadata?.selection);
  if (!geometry) return null;

  const { viewport, element, click } = geometry;
  if (viewport.width <= 0 || viewport.height <= 0) return null;
  if (element.width < 0 || element.height < 0) return null;

  const right = element.left + element.width;
  const bottom = element.top + element.height;
  const isOutside =
    right <= 0 ||
    bottom <= 0 ||
    element.left >= viewport.width ||
    element.top >= viewport.height;
  if (isOutside) return null;

  if (
    click.x < 0 ||
    click.y < 0 ||
    click.x > viewport.width ||
    click.y > viewport.height
  ) {
    return null;
  }

  // An element larger than the viewport is clipped to what the Screenshot shows.
  const left = Math.max(element.left, 0);
  const top = Math.max(element.top, 0);
  const visibleRight = Math.min(right, viewport.width);
  const visibleBottom = Math.min(bottom, viewport.height);

  return {
    element: {
      left: toPercent(left, viewport.width),
      top: toPercent(top, viewport.height),
      width: toPercent(visibleRight - left, viewport.width),
      height: toPercent(visibleBottom - top, viewport.height),
    },
    click: {
      x: toPercent(click.x, viewport.width),
      y: toPercent(click.y, viewport.height),
    },
  };
}
