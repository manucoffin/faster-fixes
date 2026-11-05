import type { VideoSelection } from "../_types/video-selection";

/**
 * Where on the frame a video Feedback points, in whole percents of the frame:
 * "Point at 42%, 61%" or "Area from (10%, 20%) to (55%, 70%)". Null when the
 * Reviewer marked time only.
 */
export function describeVideoSelection({ point, area }: VideoSelection) {
  if (point) return `Point at ${percent(point.x)}, ${percent(point.y)}`;
  if (area) {
    const from = `(${percent(area.x)}, ${percent(area.y)})`;
    const to = `(${percent(area.x + area.width)}, ${percent(area.y + area.height)})`;
    return `Area from ${from} to ${to}`;
  }
  return null;
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}
