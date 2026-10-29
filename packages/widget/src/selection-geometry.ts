import type { SelectionGeometry } from "@fasterfixes/core";

import type { PinPoint } from "./pin-placement.js";

type Viewport = Pick<Window, "innerWidth" | "innerHeight">;

/**
 * The Selection's geometry in viewport CSS pixels. Read in the same tick the
 * Screenshot capture starts, so it describes the viewport the image shows.
 */
export function measureSelectionGeometry(
  element: Element,
  click: PinPoint,
  view: Viewport = window,
): SelectionGeometry {
  const { left, top, width, height } = element.getBoundingClientRect();
  return {
    // Matches the size `captureViewportScreenshot` renders.
    viewport: { width: view.innerWidth, height: view.innerHeight },
    element: { left, top, width, height },
    click: { x: click.x, y: click.y },
  };
}
