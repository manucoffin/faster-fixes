import { formatTimecode } from "./format-timecode";

/**
 * A video Feedback's time as outbound surfaces phrase it: "At 0:12.340" for an
 * instant, "From 0:41.000 to 0:47.500" for a range.
 */
export function describeVideoFeedbackTime(
  startMs: number,
  endMs: number | null,
) {
  const start = formatTimecode(startMs, { milliseconds: true });
  if (endMs === null) return `At ${start}`;
  return `From ${start} to ${formatTimecode(endMs, { milliseconds: true })}`;
}
