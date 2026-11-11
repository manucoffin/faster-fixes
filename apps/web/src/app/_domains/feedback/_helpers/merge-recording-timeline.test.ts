import type { ConsoleEntry, NetworkEntry } from "@fasterfixes/core";
import { describe, expect, it } from "vitest";

import {
  mergeRecordingTimeline,
  RECORDING_TIMELINE_MAX_ENTRIES,
} from "./merge-recording-timeline";
import type { RecordingStep } from "./read-recording-steps";

const SELECTED_AT = 1_794_400_060_000;

const step = (
  type: RecordingStep["type"],
  timestamp: number,
  label: string | null = null,
): RecordingStep => ({
  type,
  timestamp,
  offsetMs: timestamp - SELECTED_AT,
  label,
  selector: null,
  detail: null,
});
const selection = step("selection", SELECTED_AT, 'button "Save changes"');
const log = (
  timestamp: number,
  level: ConsoleEntry["level"] = "log",
): ConsoleEntry => ({ level, message: `logged at ${timestamp}`, timestamp });
const request = (timestamp: number, status = 200): NetworkEntry => ({
  method: "GET",
  url: `/api/${timestamp}`,
  status,
  duration: 120,
  timestamp,
});

const kinds = (timeline: ReturnType<typeof mergeRecordingTimeline>) =>
  timeline.entries.map((entry) => entry.kind);
const timestamps = (timeline: ReturnType<typeof mergeRecordingTimeline>) =>
  timeline.entries.map((entry) => entry.timestamp);

describe("mergeRecordingTimeline", () => {
  it("puts steps, console entries and network entries in time order", () => {
    const timeline = mergeRecordingTimeline({
      steps: [
        step("click", SELECTED_AT - 9_000),
        step("click", SELECTED_AT - 3_000),
        selection,
      ],
      diagnosticTrail: {
        console: [log(SELECTED_AT - 2_000, "error")],
        network: [request(SELECTED_AT - 8_000), request(SELECTED_AT - 5_000)],
      },
    });

    expect(kinds(timeline)).toEqual([
      "step",
      "network",
      "network",
      "step",
      "console",
      "step",
    ]);
    expect(timestamps(timeline)).toEqual([
      SELECTED_AT - 9_000,
      SELECTED_AT - 8_000,
      SELECTED_AT - 5_000,
      SELECTED_AT - 3_000,
      SELECTED_AT - 2_000,
      SELECTED_AT,
    ]);
  });

  it("places a network entry at the start of its request", () => {
    // Started before the click, answered after it: it sits before the click.
    const slow = { ...request(SELECTED_AT - 4_000, 500), duration: 3_000 };
    const timeline = mergeRecordingTimeline({
      steps: [step("click", SELECTED_AT - 2_000), selection],
      diagnosticTrail: { console: [], network: [slow] },
    });

    expect(timeline.entries[0]).toEqual({
      kind: "network",
      entry: slow,
      timestamp: SELECTED_AT - 4_000,
      offsetMs: -4_000,
    });
  });

  it("gives every entry its offset from the Selection", () => {
    const timeline = mergeRecordingTimeline({
      steps: [selection],
      diagnosticTrail: { console: [log(SELECTED_AT - 1_250)], network: [] },
    });

    expect(timeline.entries.map((entry) => entry.offsetMs)).toEqual([
      -1_250, 0,
    ]);
  });

  it("puts an action before an entry logged at the same instant", () => {
    const timeline = mergeRecordingTimeline({
      steps: [step("click", SELECTED_AT - 1_000), selection],
      diagnosticTrail: {
        console: [log(SELECTED_AT - 1_000)],
        network: [request(SELECTED_AT - 1_000)],
      },
    });

    expect(kinds(timeline)).toEqual(["step", "network", "console", "step"]);
  });

  it("ends with the Selection and leaves out what was logged after it", () => {
    const timeline = mergeRecordingTimeline({
      steps: [step("click", SELECTED_AT - 1_000), selection],
      diagnosticTrail: {
        console: [log(SELECTED_AT + 500), log(SELECTED_AT - 500)],
        network: [request(SELECTED_AT + 2_000)],
      },
    });

    expect(timeline.entries.at(-1)).toEqual({
      kind: "step",
      step: selection,
      timestamp: SELECTED_AT,
      offsetMs: 0,
    });
    expect(timeline.entries).toHaveLength(3);
    expect(timeline.afterSelectionCount).toBe(2);
    expect(timeline.droppedCount).toBe(0);
  });

  it("reads a missing Diagnostic Trail as an empty one", () => {
    const timeline = mergeRecordingTimeline({
      steps: [step("click", SELECTED_AT - 1_000), selection],
      diagnosticTrail: null,
    });

    expect(kinds(timeline)).toEqual(["step", "step"]);
  });

  it("returns an empty timeline when there are no steps", () => {
    expect(
      mergeRecordingTimeline({
        steps: [],
        diagnosticTrail: { console: [log(SELECTED_AT)], network: [] },
      }),
    ).toEqual({ entries: [], droppedCount: 0, afterSelectionCount: 0 });
  });

  it("keeps the entries closest to the Selection over the cap and counts the rest", () => {
    const clicks = Array.from({ length: 300 }, (_, index) =>
      step("click", SELECTED_AT - (300 - index) * 1_000),
    );
    const timeline = mergeRecordingTimeline({
      steps: [...clicks, selection],
      diagnosticTrail: null,
    });

    expect(timeline.entries).toHaveLength(RECORDING_TIMELINE_MAX_ENTRIES);
    expect(timeline.droppedCount).toBe(
      300 - (RECORDING_TIMELINE_MAX_ENTRIES - 1),
    );
    expect(timeline.entries[0]?.offsetMs).toBe(
      -(RECORDING_TIMELINE_MAX_ENTRIES - 1) * 1_000,
    );
    expect(timeline.entries.at(-1)?.offsetMs).toBe(0);
  });

  it("keeps console errors and failed responses through the cut first", () => {
    const clicks = Array.from({ length: 200 }, (_, index) =>
      step("click", SELECTED_AT - (200 - index) * 1_000),
    );
    const early = SELECTED_AT - 500_000;
    const evidence = {
      console: [log(early, "error"), log(early + 1, "warn")],
      network: [
        request(early + 2, 500),
        request(early + 3, 0),
        request(early + 4, 200),
      ],
    };
    const timeline = mergeRecordingTimeline({
      steps: [...clicks, selection],
      diagnosticTrail: evidence,
    });

    const survivors = timeline.entries.filter((entry) => entry.kind !== "step");
    expect(survivors.map((entry) => entry.timestamp)).toEqual([
      early,
      early + 2,
      early + 3,
    ]);
    expect(timeline.entries).toHaveLength(RECORDING_TIMELINE_MAX_ENTRIES);
    expect(timeline.droppedCount).toBe(
      205 - (RECORDING_TIMELINE_MAX_ENTRIES - 1),
    );
    expect(timestamps(timeline)).toEqual(
      [...timestamps(timeline)].sort((a, b) => a - b),
    );
  });
});
