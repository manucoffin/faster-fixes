import { describe, expect, it } from "vitest";

import realRecording from "./read-recording-steps.real-recording.json";
import {
  RECORDING_STEPS_MAX,
  readRecordingSteps,
} from "./read-recording-steps";

const START = 1_794_400_000_000;
const SELECTION = { label: 'button "Save changes"', selector: "#save" };

type Node = {
  id: number;
  type: number;
  tagName?: string;
  attributes?: Record<string, string>;
  textContent?: string;
  childNodes?: Node[];
};

let nextId = 100;
const text = (textContent: string, id = nextId++): Node => ({
  id,
  type: 3,
  textContent,
});
const element = (
  tagName: string,
  attributes: Record<string, string> = {},
  childNodes: Node[] = [],
  id = nextId++,
): Node => ({ id, type: 2, tagName, attributes, childNodes });

// A settings form, as rrweb serializes it with the Widget's recorder options.
function settingsPage() {
  return {
    id: 1,
    type: 0,
    childNodes: [
      element("html", {}, [
        element("body", {}, [
          element(
            "form",
            { class: "settings" },
            [
              element(
                "button",
                { class: "primary" },
                [text("Save changes", 15)],
                10,
              ),
              element("button", { class: "ghost" }, [text("Cancel")], 11),
              element(
                "span",
                { class: "account-id" },
                [text("**********")],
                12,
              ),
              element(
                "div",
                { class: "card", rr_width: "200px", rr_height: "40px" },
                [],
                13,
              ),
            ],
            14,
          ),
        ]),
      ]),
    ],
  };
}

const fullSnapshot = (at: number) => ({
  type: 2,
  timestamp: START + at,
  data: { node: settingsPage(), initialOffset: { left: 0, top: 0 } },
});
const click = (at: number, id: number) => ({
  type: 3,
  timestamp: START + at,
  data: { source: 2, type: 2, id, x: 1, y: 1 },
});
const mutation = (
  at: number,
  changes: { adds?: unknown[]; texts?: unknown[] },
) => ({
  type: 3,
  timestamp: START + at,
  data: {
    source: 0,
    adds: [],
    removes: [],
    texts: [],
    attributes: [],
    ...changes,
  },
});

function steps(events: { type: number; timestamp: number }[]) {
  const result = readRecordingSteps({
    formatVersion: 1,
    events,
    selection: SELECTION,
  });
  if (!result.readable) throw new Error(result.reason);
  return result.steps;
}

describe("readRecordingSteps", () => {
  it("refuses a format version it does not know", () => {
    expect(
      readRecordingSteps({
        formatVersion: 2,
        events: [fullSnapshot(0)],
        selection: SELECTION,
      }),
    ).toEqual({ readable: false, reason: "unknown-format-version" });
  });

  it("names a clicked element of the first snapshot by label and selector", () => {
    expect(steps([fullSnapshot(0), click(1_000, 10)])[0]).toMatchObject({
      type: "click",
      label: 'button "Save changes"',
      selector: "form.settings > button.primary:nth-of-type(1)",
      detail: null,
    });
  });

  it("names an element added by a later mutation", () => {
    const toast = element(
      "button",
      { class: "toast-close", "aria-label": "Dismiss" },
      [text("x")],
    );
    const [step] = steps([
      fullSnapshot(0),
      mutation(500, { adds: [{ parentId: 14, nextId: null, node: toast }] }),
      click(1_000, toast.id),
    ]);
    expect(step).toMatchObject({
      label: 'button "Dismiss"',
      selector: "form.settings > button.toast-close:nth-of-type(3)",
    });
  });

  it("names an element by its text at the moment of the click", () => {
    const [step] = steps([
      fullSnapshot(0),
      mutation(500, { texts: [{ id: 15, value: "Saving" }] }),
      click(1_000, 10),
    ]);
    expect(step?.label).toBe('button "Saving"');
  });

  it("times each step in epoch ms and relative to the end of the Recording", () => {
    const result = readRecordingSteps({
      formatVersion: 1,
      events: [fullSnapshot(0), click(2_000, 10), click(5_000, 11)],
      selection: SELECTION,
    });
    expect(result).toMatchObject({
      readable: true,
      startedAt: START,
      endedAt: START + 5_000,
    });
    if (!result.readable) return;
    expect(
      result.steps.map(({ timestamp, offsetMs }) => ({ timestamp, offsetMs })),
    ).toEqual([
      { timestamp: START + 2_000, offsetMs: -3_000 },
      { timestamp: START + 5_000, offsetMs: 0 },
      { timestamp: START + 5_000, offsetMs: 0 },
    ]);
  });

  it("ends with the Selection at offset zero, naming the selected element", () => {
    const result = steps([
      fullSnapshot(0),
      click(1_000, 10),
      mutation(4_000, {}),
    ]);
    expect(result.at(-1)).toEqual({
      type: "selection",
      timestamp: START + 4_000,
      offsetMs: 0,
      label: 'button "Save changes"',
      selector: "#save",
      detail: null,
    });
  });

  it("falls back to the role and the selector when the label is masked", () => {
    expect(steps([fullSnapshot(0), click(1_000, 12)])[0]).toMatchObject({
      label: "span",
      selector: "form.settings > span.account-id",
    });
  });

  it("names nothing inside a blocked element", () => {
    const inside = element("button", {}, [text("Reveal card 4242")]);
    const result = steps([
      fullSnapshot(0),
      click(1_000, 13),
      // Not in the file: rrweb holds nothing inside a blocked element.
      click(2_000, 999),
      mutation(2_500, { adds: [{ parentId: 13, nextId: null, node: inside }] }),
      click(3_000, inside.id),
    ]);
    expect(result.slice(0, 3)).toMatchObject([
      { label: "div", selector: "form.settings > div.card" },
      { label: null, selector: null },
      { label: "div", selector: "form.settings > div.card" },
    ]);
    expect(JSON.stringify(result)).not.toContain("4242");
  });

  it("keeps the steps closest to the Selection under the hard maximum", () => {
    const clicks = Array.from({ length: RECORDING_STEPS_MAX + 50 }, (_, i) =>
      click(1_000 + i, 10),
    );
    const result = steps([fullSnapshot(0), ...clicks]);
    expect(result).toHaveLength(RECORDING_STEPS_MAX);
    expect(result.at(-2)?.timestamp).toBe(clicks.at(-1)?.timestamp);
    expect(result[0]?.timestamp).toBe(
      clicks.at(-(RECORDING_STEPS_MAX - 1))?.timestamp,
    );
  });

  it("derives a real Recording made with the pinned rrweb version", () => {
    const result = steps(realRecording);
    expect(
      result.map(({ type, label, selector }) => [type, label, selector]),
    ).toEqual([
      ["click", 'a "Billing"', "nav > a.nav-link:nth-of-type(2)"],
      [
        "click",
        'input[type="email"] "you@example.com"',
        "form.settings > label:nth-of-type(1) > input",
      ],
      ["click", "span", "form.settings > span.account-id"],
      [
        "click",
        'input[type="checkbox"]',
        "form.settings > label:nth-of-type(2) > input",
      ],
      ["click", 'button "Save changes"', "form.settings > button.primary"],
      ["click", 'button "Dismiss"', "#toasts > button.toast-close"],
      ["click", 'button "Save changes"', "form.settings > button.primary"],
      ["selection", SELECTION.label, SELECTION.selector],
    ]);
    expect(result.every(({ offsetMs }) => offsetMs <= 0)).toBe(true);
    expect(JSON.stringify(result)).not.toContain("acct_12345");
  });
});
