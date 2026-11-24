import type {
  AreaSelectionGeometry,
  ElementSelectionGeometry,
} from "@fasterfixes/core";

import type { AreaRect } from "./area-gesture.js";
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
): ElementSelectionGeometry {
  const { left, top, width, height } = element.getBoundingClientRect();
  return {
    // Matches the size `captureViewportScreenshot` renders.
    viewport: { width: view.innerWidth, height: view.innerHeight },
    element: { left, top, width, height },
    click: { x: click.x, y: click.y },
  };
}

/** The geometry of an area Selection, read in the same tick as its release. */
export function measureAreaGeometry(
  area: AreaRect,
  view: Viewport = window,
): AreaSelectionGeometry {
  return {
    viewport: { width: view.innerWidth, height: view.innerHeight },
    area: { ...area },
  };
}
