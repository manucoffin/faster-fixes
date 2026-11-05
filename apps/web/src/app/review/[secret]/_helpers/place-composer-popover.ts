import type { SelectionGeometry } from "./map-selection-to-box";

type Size = { width: number; height: number };

// Space between the marker and the popover, in pixels.
const GAP = 12;

function fit(preferred: number, flipped: number, size: number, bound: number) {
  if (preferred + size <= bound) return preferred;
  if (flipped >= 0) return flipped;
  // Fits on neither side: pin it to the edge it overflows least.
  return Math.max(0, Math.min(preferred, bound - size));
}

/**
 * Where the composer popover sits in the frame box, in pixels from its top
 * left: below and to the right of the marker (an area's top-right corner),
 * flipped to the other side on an axis where it would leave the box.
 */
export function placeComposerPopover(
  geometry: SelectionGeometry,
  box: Size,
  popover: Size,
) {
  const anchorX =
    (geometry.kind === "area"
      ? geometry.left + geometry.width
      : geometry.left) * box.width;
  const anchorY = geometry.top * box.height;

  return {
    left: fit(
      anchorX + GAP,
      anchorX - GAP - popover.width,
      popover.width,
      box.width,
    ),
    top: fit(
      anchorY + GAP,
      anchorY - GAP - popover.height,
      popover.height,
      box.height,
    ),
  };
}
