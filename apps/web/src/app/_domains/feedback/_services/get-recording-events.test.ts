import { gzipSync } from "node:zlib";
import { describe, expect, it, vi } from "vitest";
import {
  getRecordingEvents,
  RECORDING_MAX_DECOMPRESSED_BYTES,
} from "./get-recording-events";

const RECORDING = { key: "feedback-recordings/feedback_1/recording.gz" };

const EVENTS = [
  { type: 4, timestamp: 1_700_000_000_000, data: { href: "https://a.test/" } },
  { type: 2, timestamp: 1_700_000_000_010, data: { node: { id: 1 } } },
  { type: 3, timestamp: 1_700_000_001_000, data: { source: 2, id: 7 } },
];

function storedFile(file: Buffer | null) {
  return vi.fn(() => Promise.resolve(file));
}

describe("getRecordingEvents", () => {
  it("returns the events of a valid gzip file", async () => {
    const readStorageObject = storedFile(
      gzipSync(Buffer.from(JSON.stringify(EVENTS))),
    );

    const result = await getRecordingEvents(RECORDING, readStorageObject);

    expect(result).toEqual({ readable: true, events: EVENTS });
    expect(readStorageObject).toHaveBeenCalledWith(RECORDING);
  });

  it("reports a missing object as unreadable", async () => {
    expect(await getRecordingEvents(RECORDING, storedFile(null))).toEqual({
      readable: false,
      reason: "missing",
    });
  });

  it("reports a failed storage read as unreadable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const readStorageObject = vi.fn(() =>
      Promise.reject(new Error("GetObject failed with status 500.")),
    );

    expect(await getRecordingEvents(RECORDING, readStorageObject)).toEqual({
      readable: false,
      reason: "missing",
    });
  });

  it("reports a file that is not gzip as unreadable", async () => {
    const readStorageObject = storedFile(Buffer.from(JSON.stringify(EVENTS)));

    expect(await getRecordingEvents(RECORDING, readStorageObject)).toEqual({
      readable: false,
      reason: "not-gzip",
    });
  });

  it("reports a truncated gzip file as unreadable", async () => {
    const file = gzipSync(Buffer.from(JSON.stringify(EVENTS)));

    expect(
      await getRecordingEvents(RECORDING, storedFile(file.subarray(0, 20))),
    ).toEqual({ readable: false, reason: "not-gzip" });
  });

  it("reports a file over the decompressed cap as unreadable", async () => {
    // A few hundred kilobytes of gzip that would inflate past the cap.
    const bomb = gzipSync(Buffer.alloc(RECORDING_MAX_DECOMPRESSED_BYTES + 1));

    expect(await getRecordingEvents(RECORDING, storedFile(bomb))).toEqual({
      readable: false,
      reason: "too-large",
    });
  });

  it.each([
    ["not JSON", "<html>"],
    ["not a list", JSON.stringify({ events: EVENTS })],
    ["a list of non-events", JSON.stringify([{ type: "click" }])],
  ])("reports a file holding %s as unreadable", async (_case, content) => {
    const readStorageObject = storedFile(gzipSync(Buffer.from(content)));

    expect(await getRecordingEvents(RECORDING, readStorageObject)).toEqual({
      readable: false,
      reason: "invalid-events",
    });
  });
});
