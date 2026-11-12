import { describe, expect, it } from "vitest";

import { formatTimelineLines } from "./format-timeline-lines";
import type { RecordingTimelineEntry } from "./merge-recording-timeline";
import type { RecordingStep } from "./read-recording-steps";

const SELECTED_AT = 1_794_400_060_000;

const stepEntry = (
  offsetMs: number,
  fields: Partial<RecordingStep> & Pick<RecordingStep, "type">,
): RecordingTimelineEntry => ({
  kind: "step",
  timestamp: SELECTED_AT + offsetMs,
  offsetMs,
  step: {
    timestamp: SELECTED_AT + offsetMs,
    offsetMs,
    label: null,
    selector: null,
    detail: null,
    ...fields,
  },
});
const selection = stepEntry(0, {
  type: "selection",
  label: 'button "Save changes"',
  selector: "#save",
});

describe("formatTimelineLines", () => {
  it("renders a step with its offset, type, label and selector", () => {
    const lines = formatTimelineLines({
      entries: [
        stepEntry(-12_400, {
          type: "click",
          label: 'button "Save changes"',
          selector: "form.settings > button.primary",
        }),
        selection,
      ],
      droppedCount: 0,
      afterSelectionCount: 0,
    });

    expect(lines[0]).toBe(
      '- -12.4 s  click button "Save changes" (form.settings > button.primary)',
    );
  });

  it("renders a step's detail and skips what it does not have", () => {
    const lines = formatTimelineLines({
      entries: [
        stepEntry(-3_000, { type: "resize", detail: "1280x720" }),
        stepEntry(-2_000, { type: "click", selector: "div.card" }),
        selection,
      ],
      droppedCount: 0,
      afterSelectionCount: 0,
    });

    expect(lines.slice(0, 2)).toEqual([
      "- -3.0 s  resize 1280x720",
      "- -2.0 s  click (div.card)",
    ]);
  });

  it("words the opening step, with the page the Reviewer came from", () => {
    const lines = formatTimelineLines({
      entries: [
        stepEntry(-9_000, {
          type: "load",
          label: "Page loaded",
          detail: "/cart",
        }),
        stepEntry(-8_000, { type: "load", label: "Page reloaded" }),
        selection,
      ],
      droppedCount: 0,
      afterSelectionCount: 0,
    });

    expect(lines.slice(0, 2)).toEqual([
      "- -9.0 s  Page loaded, from /cart",
      "- -8.0 s  Page reloaded",
    ]);
  });

  it("renders console and network entries as Diagnostics does, with a time in front", () => {
    const lines = formatTimelineLines({
      entries: [
        {
          kind: "network",
          timestamp: SELECTED_AT - 4_000,
          offsetMs: -4_000,
          entry: {
            method: "POST",
            url: "/api/settings",
            status: 500,
            duration: 182.4,
            timestamp: SELECTED_AT - 4_000,
          },
        },
        {
          kind: "network",
          timestamp: SELECTED_AT - 3_500,
          offsetMs: -3_500,
          entry: {
            method: "GET",
            url: "/api/ping",
            status: 0,
            duration: 10,
            timestamp: SELECTED_AT - 3_500,
          },
        },
        {
          kind: "console",
          timestamp: SELECTED_AT - 3_200,
          offsetMs: -3_200,
          entry: {
            level: "error",
            message: "Save failed:\n  500",
            timestamp: SELECTED_AT - 3_200,
          },
        },
        selection,
      ],
      droppedCount: 0,
      afterSelectionCount: 0,
    });

    expect(lines.slice(0, 3)).toEqual([
      "- -4.0 s  `POST` /api/settings → 500 (182ms)",
      "- -3.5 s  `GET` /api/ping → ERR (10ms)",
      "- -3.2 s  `error` Save failed: 500",
    ]);
  });

  it("ends with the Selection line tied to the comment", () => {
    const lines = formatTimelineLines({
      entries: [stepEntry(-30, { type: "click" }), selection],
      droppedCount: 0,
      afterSelectionCount: 0,
    });

    expect(lines).toEqual([
      "- 0.0 s  click",
      '- 0.0 s  selection button "Save changes" (#save), the element the comment is about',
    ]);
  });

  it("opens with how many entries were left out", () => {
    const lines = formatTimelineLines({
      entries: [selection],
      droppedCount: 12,
      afterSelectionCount: 1,
    });

    expect(lines).toEqual([
      "12 earlier entries omitted.",
      "1 entry after the Selection omitted.",
      "",
      '- 0.0 s  selection button "Save changes" (#save), the element the comment is about',
    ]);
  });

  it("returns no lines for an empty timeline", () => {
    expect(
      formatTimelineLines({
        entries: [],
        droppedCount: 0,
        afterSelectionCount: 0,
      }),
    ).toEqual([]);
  });
});
