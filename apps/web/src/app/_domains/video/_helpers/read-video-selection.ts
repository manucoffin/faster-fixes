import type { VideoSelection } from "../_types/video-selection";

type FrameColumns = {
  frameX: number | null;
  frameY: number | null;
  frameWidth: number | null;
  frameHeight: number | null;
};

/**
 * The Selection stored in a Feedback's flat frame columns: a `point` when only
 * x and y are set, an `area` when the size is set too, and neither when the
 * Feedback marks no part of the frame.
 */
export function readVideoSelection({
  frameX: x,
  frameY: y,
  frameWidth: width,
  frameHeight: height,
}: FrameColumns): VideoSelection {
  const hasPosition = x !== null && y !== null;
  const hasSize = width !== null && height !== null;

  return {
    point: hasPosition && !hasSize ? { x, y } : null,
    area: hasPosition && hasSize ? { x, y, width, height } : null,
  };
}
