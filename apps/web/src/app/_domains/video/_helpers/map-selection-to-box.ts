import type { VideoSelection } from "../_types/video-selection";

type Size = { width: number; height: number };

/** Where a Selection lands, as fractions (0..1) of the box it is drawn in. */
export type SelectionGeometry =
  | { kind: "point"; left: number; top: number }
  | { kind: "area"; left: number; top: number; width: number; height: number };

/**
 * Maps a Selection, normalized to the Video's frame, onto a box that shows the
 * frame letterboxed (`object-contain`). A frame wider than the box leaves bands
 * above and below it; a narrower one leaves bands at the sides.
 */
export function mapSelectionToBox(
  selection: VideoSelection,
  frame: Size,
  box: Size,
): SelectionGeometry | null {
  const scale = Math.min(box.width / frame.width, box.height / frame.height);
  const frameWidth = (frame.width * scale) / box.width;
  const frameHeight = (frame.height * scale) / box.height;
  const offsetLeft = (1 - frameWidth) / 2;
  const offsetTop = (1 - frameHeight) / 2;

  if (selection.area) {
    return {
      kind: "area",
      left: offsetLeft + selection.area.x * frameWidth,
      top: offsetTop + selection.area.y * frameHeight,
      width: selection.area.width * frameWidth,
      height: selection.area.height * frameHeight,
    };
  }
  if (selection.point) {
    return {
      kind: "point",
      left: offsetLeft + selection.point.x * frameWidth,
      top: offsetTop + selection.point.y * frameHeight,
    };
  }
  return null;
}
