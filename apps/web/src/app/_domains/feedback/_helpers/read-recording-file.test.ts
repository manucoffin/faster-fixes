import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";

import realRecording from "./read-recording-steps.real-recording.json";
import { readRecordingFile } from "./read-recording-file";
import {
  PAGE_SESSION_TAG,
  RECORDING_MAX_DECOMPRESSED_BYTES,
} from "./recording-format";

const EVENTS = [
  { type: 4, timestamp: 1_700_000_000_000, data: { href: "https://a.test/" } },
  { type: 2, timestamp: 1_700_000_000_010, data: { node: { id: 1 } } },
  { type: 3, timestamp: 1_700_000_001_000, data: { source: 2, id: 7 } },
];

// What `fetch(...).arrayBuffer()` hands the reader.
function asFile(bytes: Buffer) {
  return new Uint8Array(bytes).buffer;
}

function gzipFile(content: unknown) {
  return asFile(gzipSync(Buffer.from(JSON.stringify(content))));
}

describe("readRecordingFile", () => {
  it("returns the events of a gzip file", async () => {
    expect(
      await readRecordingFile({ file: gzipFile(EVENTS), formatVersion: 1 }),
    ).toEqual({ readable: true, events: EVENTS });
  });

  it("returns the events of the real recorded file, without its page-session marker", async () => {
    const result = await readRecordingFile({
      file: gzipFile(realRecording),
      formatVersion: 1,
    });

    expect(result).toEqual({
      readable: true,
      events: realRecording.filter(
        (event) =>
          !(
            event.type === 5 &&
            (event.data as { tag?: string }).tag === PAGE_SESSION_TAG
          ),
      ),
    });
    expect(JSON.stringify(result)).not.toContain(PAGE_SESSION_TAG);
  });

  it("keeps a custom event that is not the page-session marker", async () => {
    const marker = {
      type: 5,
      timestamp: 1_700_000_000_010,
      data: { tag: PAGE_SESSION_TAG, payload: { navigationType: "load" } },
    };
    const other = {
      type: 5,
      timestamp: 1_700_000_000_020,
      data: { tag: "site/checkout", payload: {} },
    };

    expect(
      await readRecordingFile({
        file: gzipFile([EVENTS[0], EVENTS[1], marker, other, EVENTS[2]]),
        formatVersion: 1,
      }),
    ).toEqual({
      readable: true,
      events: [EVENTS[0], EVENTS[1], other, EVENTS[2]],
    });
  });

  it("refuses an unknown format version", async () => {
    expect(
      await readRecordingFile({ file: gzipFile(EVENTS), formatVersion: 2 }),
    ).toEqual({ readable: false, reason: "unknown-format-version" });
  });

  it("refuses a file over the default bound", async () => {
    const bomb = asFile(
      gzipSync(Buffer.alloc(RECORDING_MAX_DECOMPRESSED_BYTES + 1)),
    );

    expect(await readRecordingFile({ file: bomb, formatVersion: 1 })).toEqual({
      readable: false,
      reason: "too-large",
    });
  });

  it("stops inflating at the bound, before the end of the file", async () => {
    // Without its trailer, inflating to the end fails as not gzip: a
    // `too-large` answer proves the reader stopped before reaching it.
    const bomb = gzipSync(Buffer.alloc(8 * 1024 * 1024));
    const truncated = asFile(bomb.subarray(0, bomb.length - 8));

    expect(
      await readRecordingFile({
        file: truncated,
        formatVersion: 1,
        maxDecompressedBytes: 1024 * 1024,
      }),
    ).toEqual({ readable: false, reason: "too-large" });
  });

  it("refuses a file that is not gzip", async () => {
    expect(
      await readRecordingFile({
        file: asFile(Buffer.from(JSON.stringify(EVENTS))),
        formatVersion: 1,
      }),
    ).toEqual({ readable: false, reason: "not-gzip" });
  });

  it("refuses a truncated gzip file", async () => {
    const file = gzipSync(Buffer.from(JSON.stringify(EVENTS)));

    expect(
      await readRecordingFile({
        file: asFile(file.subarray(0, 20)),
        formatVersion: 1,
      }),
    ).toEqual({ readable: false, reason: "not-gzip" });
  });

  it.each([
    ["not JSON", "<html>"],
    ["not a list", JSON.stringify({ events: EVENTS })],
    ["a list of non-events", JSON.stringify([{ type: "click" }])],
  ])("refuses a file holding %s", async (_case, content) => {
    expect(
      await readRecordingFile({
        file: asFile(gzipSync(Buffer.from(content))),
        formatVersion: 1,
      }),
    ).toEqual({ readable: false, reason: "invalid-events" });
  });
});
