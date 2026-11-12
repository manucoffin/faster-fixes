import type {
  RecordingPlayerEvent,
  RecordingPlayerViewport,
} from "@/app/_domains/feedback/_helpers/recording-player-protocol";

// rrweb's event types for the snapshot of the page and the size of its viewport.
const FULL_SNAPSHOT = 2;
const META = 4;

/**
 * The recorded viewport of a Recording the replayer can rebuild, or null when
 * it cannot: rrweb needs two events at least, a snapshot of the page and the
 * size of the viewport it was taken in.
 */
export function readRecordingViewport(
  events: RecordingPlayerEvent[],
): RecordingPlayerViewport | null {
  if (events.length < 2) return null;
  if (!events.some((event) => event.type === FULL_SNAPSHOT)) return null;

  const data = events.find((event) => event.type === META)?.data;
  if (typeof data !== "object" || data === null) return null;
  const { width, height } = data as Record<string, unknown>;
  if (typeof width !== "number" || typeof height !== "number") return null;
  if (!(width > 0 && height > 0)) return null;
  return { width, height };
}
