import { afterEach, describe, expect, it, vi } from "vitest";

import type { Recording } from "./recording-buffer.js";
import { RECORDING_FORMAT_VERSION, toRecordingFile } from "./recording-file.js";

function recording(events: unknown[], durationMs: number) {
  return { events, durationMs, marker: null } satisfies Recording<
    unknown,
    null
  >;
}

async function readEvents(file: Blob) {
  const stream = file.stream().pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(stream).text()) as unknown;
}

// Random text barely compresses, so its size is known within a few bytes.
function noise(bytes: number) {
  let text = "";
  while (text.length < bytes) text += Math.random().toString(36).slice(2);
  return text.slice(0, bytes);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("toRecordingFile", () => {
  it("compresses the events as a gzip JSON array with the duration and format version", async () => {
    const events = [
      { type: 2, timestamp: 1 },
      { type: 3, timestamp: 2 },
    ];

    const result = await toRecordingFile([recording(events, 1_500)]);

    expect(result?.durationMs).toBe(1_500);
    expect(result?.formatVersion).toBe(RECORDING_FORMAT_VERSION);
    expect(result?.file.type).toBe("application/gzip");
    expect(await readEvents(result?.file ?? new Blob())).toEqual(events);
  });

  it("falls back to the latest slice when the whole copy is over the cap", async () => {
    const whole = recording(
      [{ text: noise(4_000) }, { text: "latest" }],
      50_000,
    );
    const latest = recording([{ text: "latest" }], 20_000);

    const result = await toRecordingFile([whole, latest], 2_000);

    expect(result?.durationMs).toBe(20_000);
    expect(await readEvents(result?.file ?? new Blob())).toEqual([
      { text: "latest" },
    ]);
  });

  it("is null when nothing fits the cap", async () => {
    const result = await toRecordingFile(
      [recording([{ text: noise(4_000) }], 10_000)],
      2_000,
    );

    expect(result).toBeNull();
  });

  it("is null when there is no candidate", async () => {
    expect(await toRecordingFile([])).toBeNull();
  });

  it("is null in a browser without CompressionStream", async () => {
    vi.stubGlobal("CompressionStream", undefined);

    const result = await toRecordingFile([recording([{ type: 2 }], 1_000)]);

    expect(result).toBeNull();
  });
});
