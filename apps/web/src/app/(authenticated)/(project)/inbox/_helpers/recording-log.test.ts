import { mergeRecordingTimeline } from "@/app/_domains/feedback/_helpers/merge-recording-timeline";
import type { RecordingStep } from "@/app/_domains/feedback/_helpers/read-recording-steps";
import { describe, expect, it } from "vitest";
import {
  filterRecordingLog,
  findCurrentLogEntry,
  recordingLogTime,
  recordingTimelineMarks,
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

describe("recordingTimelineMarks", () => {
  // Every level and outcome a mark is or is not given for, at 1 s steps.
  const all = mergeRecordingTimeline({
    steps: [
      { ...step("load", 0), label: "Page loaded" },
      { ...step("click", 1_000), label: '"Save"' },
      step("selection", 10_000),
    ],
    diagnosticTrail: {
      console: (["log", "info", "debug", "warn", "error"] as const).map(
        (level, index) => ({
          level,
          message: "Something\n  happened",
          timestamp: STARTED_AT + 2_000 + index * 1_000,
        }),
      ),
      network: [
        { status: 200, at: 7_000 },
        { status: 404, at: 8_000 },
        { status: 0, at: 9_000 },
      ].map(({ status, at }) => ({
        method: "GET",
        url: "/api/items",
        status,
        duration: 20,
        timestamp: STARTED_AT + at,
      })),
    },
  }).entries;

  it("marks steps, console errors and warnings and failed requests only", () => {
    expect(
      recordingTimelineMarks(all, clock).map(({ tone, text }) => [tone, text]),
    ).toEqual([
      ["step", "Page loaded"],
      ["step", 'click "Save"'],
      ["warning", "warn Something happened"],
      ["error", "error Something happened"],
      ["error", "GET /api/items 404"],
      ["error", "GET /api/items err"],
      ["step", "selection, the element the comment is about"],
    ]);
  });

  it("places each mark along the duration", () => {
    expect(
      recordingTimelineMarks(all, clock).map(({ time, position }) => [
        time,
        position,
      ]),
    ).toEqual([
      [0, 0],
      [1_000, 0.1],
      [5_000, 0.5],
      [6_000, 0.6],
      [8_000, 0.8],
      [9_000, 0.9],
      [10_000, 1],
    ]);
  });

  it("is at the start for a Recording of no duration", () => {
    const marks = recordingTimelineMarks(entries, {
      startedAt: STARTED_AT,
      durationMs: 0,
    });
    expect(marks.map(({ position }) => position)).toEqual([0, 0, 0, 0, 0]);
  });
});
