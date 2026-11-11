import { mergeRecordingTimeline } from "@/app/_domains/feedback/_helpers/merge-recording-timeline";
import type { RecordingStep } from "@/app/_domains/feedback/_helpers/read-recording-steps";
import { describe, expect, it } from "vitest";
import {
  filterRecordingLog,
  findCurrentLogEntry,
  recordingLogTime,
} from "./recording-log";

const STARTED_AT = 1_794_400_000_000;
const clock = { startedAt: STARTED_AT, durationMs: 10_000 };

const step = (type: RecordingStep["type"], at: number): RecordingStep => ({
  type,
  timestamp: STARTED_AT + at,
  offsetMs: at - clock.durationMs,
  label: null,
  selector: null,
  detail: null,
});

// Loaded at 0, a click at 2 s, a failed request at 4 s, an error at 6 s, the
// Selection at the end.
const { entries } = mergeRecordingTimeline({
  steps: [step("load", 0), step("click", 2_000), step("selection", 10_000)],
  diagnosticTrail: {
    console: [
      { level: "error", message: "Boom", timestamp: STARTED_AT + 6_000 },
    ],
    network: [
      {
        method: "POST",
        url: "/api/save",
        status: 500,
        duration: 80,
        timestamp: STARTED_AT + 4_000,
      },
    ],
  },
});

describe("findCurrentLogEntry", () => {
  it("is the last entry at or before the playhead", () => {
    expect(findCurrentLogEntry(entries, clock, 4_000)).toBe(2);
    expect(findCurrentLogEntry(entries, clock, 5_999)).toBe(2);
    expect(findCurrentLogEntry(entries, clock, 6_000)).toBe(3);
  });

  it("is none before the first entry", () => {
    const later = entries.slice(1);
    expect(findCurrentLogEntry(later, clock, 1_000)).toBe(-1);
  });

  it("is the Selection at the end", () => {
    const index = findCurrentLogEntry(entries, clock, clock.durationMs);
    expect(index).toBe(entries.length - 1);
    expect(entries[index]).toMatchObject({
      kind: "step",
      step: { type: "selection" },
    });
  });

  it("is none without a clock, when the Recording cannot be read", () => {
    expect(findCurrentLogEntry(entries, null, 4_000)).toBe(-1);
  });
});

describe("filterRecordingLog", () => {
  it("keeps every source when none is hidden", () => {
    expect(filterRecordingLog(entries, new Set())).toEqual(entries);
  });

  it("hides each source on its own", () => {
    const kinds = (hidden: Parameters<typeof filterRecordingLog>[1]) =>
      filterRecordingLog(entries, hidden).map((entry) => entry.kind);

    expect(kinds(new Set(["step"]))).toEqual(["network", "console"]);
    expect(kinds(new Set(["console"]))).toEqual([
      "step",
      "step",
      "network",
      "step",
    ]);
    expect(kinds(new Set(["network"]))).toEqual([
      "step",
      "step",
      "console",
      "step",
    ]);
  });
});

describe("recordingLogTime", () => {
  it("places an entry on the player's clock", () => {
    expect(recordingLogTime(entries[2]!, clock)).toBe(4_000);
  });

  it("places an entry logged before the Recording at its start", () => {
    const early = { ...entries[2]!, timestamp: STARTED_AT - 3_000 };
    expect(recordingLogTime(early, clock)).toBe(0);
  });
});
