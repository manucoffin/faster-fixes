import { z } from "zod";

import {
  PAGE_SESSION_TAG,
  RECORDING_FORMAT_VERSIONS,
  RECORDING_MAX_DECOMPRESSED_BYTES,
} from "./recording-format";
import type { RecordingPlayerEvent } from "./recording-player-protocol";

// The dashboard's reader of a Recording file, run in the Member's browser
// (ADR-0023): bytes in, the events to hand the player document out.

// Only the fields every rrweb event carries; the replayer reads the rest.
const RecordingEventsSchema = z.array(
  z.looseObject({ type: z.number(), timestamp: z.number() }),
);

// rrweb's EventType value for a custom event.
const CUSTOM = 5;

export type RecordingFileRefusal =
  | "unknown-format-version"
  | "not-gzip"
  | "too-large"
  | "invalid-events";

/**
 * The events to play from a Recording file and its stored format version.
 * Never throws: every failure is a refusal with its reason.
 */
export async function readRecordingFile({
  file,
  formatVersion,
  maxDecompressedBytes = RECORDING_MAX_DECOMPRESSED_BYTES,
}: {
  file: ArrayBuffer;
  formatVersion: number;
  maxDecompressedBytes?: number;
}): Promise<
  | { readable: true; events: RecordingPlayerEvent[] }
  | { readable: false; reason: RecordingFileRefusal }
> {
  if (!RECORDING_FORMAT_VERSIONS.has(formatVersion)) {
    return { readable: false, reason: "unknown-format-version" };
  }

  const inflated = await inflateRecordingFile(file, maxDecompressedBytes);
  if (!inflated.inflated) return { readable: false, reason: inflated.reason };

  let parsed: unknown;
  try {
    parsed = JSON.parse(inflated.text);
  } catch {
    return { readable: false, reason: "invalid-events" };
  }
  const events = RecordingEventsSchema.safeParse(parsed);
  if (!events.success) return { readable: false, reason: "invalid-events" };

  return {
    readable: true,
    events: events.data.filter((event) => !isPageSessionMarker(event)),
  };
}

async function inflateRecordingFile(
  file: ArrayBuffer,
  maxDecompressedBytes: number,
): Promise<
  | { inflated: true; text: string }
  | { inflated: false; reason: "not-gzip" | "too-large" }
> {
  const reader = new Blob([file])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"))
    .getReader();
  const decoder = new TextDecoder();
  let text = "";
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxDecompressedBytes) {
        // Stops inflating here, so a file built to inflate never fills memory.
        await reader.cancel().catch(() => undefined);
        return { inflated: false, reason: "too-large" };
      }
      text += decoder.decode(value, { stream: true });
    }
  } catch {
    return { inflated: false, reason: "not-gzip" };
  }
  return { inflated: true, text: text + decoder.decode() };
}

// The Widget's page-session marker is a custom event for the derivation, not
// something to replay.
function isPageSessionMarker(event: { type: number; data?: unknown }) {
  return (
    event.type === CUSTOM &&
    typeof event.data === "object" &&
    event.data !== null &&
    "tag" in event.data &&
    event.data.tag === PAGE_SESSION_TAG
  );
}
