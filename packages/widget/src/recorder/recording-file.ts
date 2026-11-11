import type { RecordingFile } from "./contract.js";
import { fitRecording } from "./recording-buffer.js";
import type { Recording } from "./recording-buffer.js";

/** The layout of the file: a gzip-compressed JSON array of rrweb events. */
export const RECORDING_FORMAT_VERSION = 1;

// Below the cloud host's 4.5 MB request body limit, as the upload route checks.
export const RECORDING_MAX_BYTES = 4 * 1024 * 1024;

async function gzipEvents(events: readonly unknown[]) {
  const stream = new Blob([JSON.stringify(events)])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));
  return new Blob([await new Response(stream).arrayBuffer()], {
    type: "application/gzip",
  });
}

/**
 * Compresses the largest candidate that fits the cap. Null when none fits,
 * when there is none, or when the browser has no `CompressionStream`.
 */
export async function toRecordingFile<E, M>(
  candidates: Recording<E, M>[],
  maxBytes = RECORDING_MAX_BYTES,
): Promise<RecordingFile | null> {
  if (typeof CompressionStream === "undefined") return null;
  try {
    const fitted = await fitRecording(candidates, maxBytes, (recording) =>
      gzipEvents(recording.events),
    );
    if (!fitted) return null;
    return {
      file: fitted.measured,
      durationMs: fitted.recording.durationMs,
      formatVersion: RECORDING_FORMAT_VERSION,
    };
  } catch {
    return null;
  }
}
