type FormatTimecodeOptions = {
  /** Shows milliseconds, as the bounds of a range need to. */
  milliseconds?: boolean;
};

/**
 * A playhead position as the review page shows it: `m:ss`, `h:mm:ss` past an
 * hour, and a `.mmm` suffix when milliseconds are asked for.
 */
export function formatTimecode(
  ms: number,
  { milliseconds = false }: FormatTimecodeOptions = {},
) {
  const totalMs = Math.max(0, Math.floor(ms));
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor(totalMs / 60_000) % 60;
  const seconds = Math.floor(totalMs / 1000) % 60;

  const clock =
    hours > 0
      ? `${hours}:${pad(minutes, 2)}:${pad(seconds, 2)}`
      : `${minutes}:${pad(seconds, 2)}`;

  return milliseconds ? `${clock}.${pad(totalMs % 1000, 3)}` : clock;
}

function pad(value: number, length: number) {
  return String(value).padStart(length, "0");
}

/** A Feedback's time: an instant, or a range as "a to b" to the millisecond. */
export function formatFeedbackTime(startMs: number, endMs: number | null) {
  if (endMs === null) return formatTimecode(startMs);
  return `${formatTimecode(startMs, { milliseconds: true })} to ${formatTimecode(endMs, { milliseconds: true })}`;
}
