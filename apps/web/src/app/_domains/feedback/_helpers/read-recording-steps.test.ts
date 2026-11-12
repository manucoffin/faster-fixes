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
              element(
                "input",
                { type: "email", name: "email", value: "*********" },
                [],
                20,
              ),
              element(
                "select",
                { name: "plan" },
                [element("option", { value: "pro" }, [text("Pro")])],
                21,
              ),
              element("input", { type: "checkbox", name: "terms" }, [], 22),
              element("input", { type: "radio", name: "seat" }, [], 23),
              element("input", { type: "radio", name: "seat" }, [], 24),
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
const input = (at: number, id: number, text: string, isChecked = false) => ({
  type: 3,
  timestamp: START + at,
  data: { source: 5, id, text, isChecked },
});
const scroll = (at: number, y: number, id = 1) => ({
  type: 3,
  timestamp: START + at,
  data: { source: 3, id, x: 0, y },
});
const resize = (at: number, width: number, height: number) => ({
  type: 3,
  timestamp: START + at,
  data: { source: 4, width, height },
});
const pageSession = (
  at: number,
  payload: { navigationType: string; referrerPath?: string },
) => ({
  type: 5,
  timestamp: START + at,
  data: { tag: "fasterfixes/page-session", payload },
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

  it("makes one input step of a run of typing in one field, never printing a masked value", () => {
    const result = steps([
      fullSnapshot(0),
      input(1_000, 20, "*"),
      input(1_200, 20, "*****"),
      input(1_400, 20, "*********"),
      click(2_000, 10),
    ]);
    expect(result.slice(0, 2)).toEqual([
      {
        type: "input",
        timestamp: START + 1_000,
        offsetMs: -1_000,
        label: 'input[type="email"]',
        selector: "form.settings > input:nth-of-type(1)",
        detail: null,
      },
      expect.objectContaining({ type: "click" }),
    ]);
    expect(JSON.stringify(result)).not.toContain("*");
  });

  it("starts a new input step when the Reviewer comes back to a field", () => {
    const result = steps([
      fullSnapshot(0),
      input(1_000, 20, "***"),
      click(2_000, 10),
      input(3_000, 20, "****"),
    ]);
    expect(result.map(({ type }) => type)).toEqual([
      "input",
      "click",
      "input",
      "selection",
    ]);
  });

  it("prints a typed value only when the file holds it unmasked", () => {
    const [step] = steps([fullSnapshot(0), input(1_000, 20, "jane")]);
    expect(step).toMatchObject({ type: "input", detail: "jane" });
  });

  it("makes a select step of a choice in a list, a checkbox and a radio", () => {
    const result = steps([
      fullSnapshot(0),
      input(1_000, 21, "***"),
      click(2_000, 22),
      input(2_000, 22, "on", true),
      input(3_000, 22, "on", false),
      // rrweb writes the other radios of the group unchecked.
      input(4_000, 24, "on", true),
      input(4_000, 23, "on", false),
    ]);
    expect(
      result.map(({ type, selector, detail }) => [type, selector, detail]),
    ).toEqual([
      ["select", "form.settings > select", null],
      ["select", "form.settings > input:nth-of-type(2)", "checked"],
      ["select", "form.settings > input:nth-of-type(2)", "unchecked"],
      ["select", "form.settings > input:nth-of-type(4)", "checked"],
      ["selection", SELECTION.selector, null],
    ]);
  });

  it("collapses a run of scrolling into one step, at its final position", () => {
    const result = steps([
      fullSnapshot(0),
      scroll(1_000, 200),
      scroll(1_100, 600),
      scroll(1_200, 900.4),
      click(2_000, 10),
      scroll(3_000, 0),
    ]);
    expect(
      result.map(({ type, timestamp, detail }) => [type, timestamp, detail]),
    ).toEqual([
      ["scroll", START + 1_000, "to 0,900"],
      ["click", START + 2_000, null],
      ["scroll", START + 3_000, "to 0,0"],
      ["selection", START + 3_000, null],
    ]);
  });

  it("names the element a scroll happened in, and nothing for the page", () => {
    const [page, card] = steps([
      fullSnapshot(0),
      scroll(1_000, 100),
      scroll(2_000, 50, 14),
    ]);
    expect(page).toMatchObject({ label: null, selector: null });
    expect(card).toMatchObject({ selector: "form.settings" });
  });

  it("makes a resize step with the viewport's size", () => {
    const result = steps([
      fullSnapshot(0),
      resize(1_000, 1280, 720),
      resize(1_100, 1024, 700),
    ]);
    expect(result[0]).toEqual({
      type: "resize",
      timestamp: START + 1_000,
      offsetMs: -100,
      label: null,
      selector: null,
      detail: "1024x700",
    });
    expect(result).toHaveLength(2);
  });

  it.each([
    [{ navigationType: "load" }, "Page loaded", null],
    [{ navigationType: "load", referrerPath: "/cart" }, "Page loaded", "/cart"],
    [{ navigationType: "reload" }, "Page reloaded", null],
    [{ navigationType: "back_forward" }, "Returned with back or forward", null],
  ])("opens with the page session %j", (payload, label, detail) => {
    const [step] = steps([fullSnapshot(0), pageSession(0, payload)]);
    expect(step).toEqual({
      type: "load",
      timestamp: START,
      offsetMs: 0,
      label,
      selector: null,
      detail,
    });
  });

  it.each(["https://other.example/cart", "//other.example/cart", "cart"])(
    "never shows a referrer that is not a path of the same site: %s",
    (referrerPath) => {
      const [step] = steps([
        fullSnapshot(0),
        pageSession(0, { navigationType: "load", referrerPath }),
      ]);
      expect(step).toMatchObject({ type: "load", detail: null });
      expect(JSON.stringify(step)).not.toContain("other.example");
    },
  );

  it("has no opening step without the page-session marker", () => {
    const otherCustomEvent = {
      type: 5,
      timestamp: START,
      data: { tag: "custom", payload: {} },
    };
    const result = steps([fullSnapshot(0), otherCustomEvent, click(1_000, 10)]);
    expect(result.map(({ type }) => type)).toEqual(["click", "selection"]);
  });

  it("keeps the hard maximum with every step type", () => {
    const actions = Array.from({ length: RECORDING_STEPS_MAX }, (_, i) => {
      const at = 1_000 + i * 10;
      return [
        click(at, 10),
        input(at + 1, 20, "***"),
        input(at + 2, 22, "on", i % 2 === 0),
        scroll(at + 3, i),
        resize(at + 4, 800 + i, 600),
      ];
    }).flat();
    const result = steps([
      fullSnapshot(0),
      pageSession(0, { navigationType: "load" }),
      ...actions,
    ]);
    expect(result).toHaveLength(RECORDING_STEPS_MAX);
    expect(result.at(-1)?.type).toBe("selection");
    expect(result.at(-2)).toMatchObject({ type: "resize", detail: "999x600" });
  });

  it("derives a real Recording made with the pinned rrweb version", () => {
    const result = steps(realRecording);
    expect(
      result.map(({ type, label, selector }) => [type, label, selector]),
    ).toEqual([
      ["load", "Page loaded", null],
      ["click", 'a "Billing"', "nav > a.nav-link:nth-of-type(2)"],
      [
        "click",
        'input[type="email"] "you@example.com"',
        "form.settings > label:nth-of-type(1) > input",
      ],
      [
        "input",
        'input[type="email"] "you@example.com"',
        "form.settings > label:nth-of-type(1) > input",
      ],
      ["click", "span", "form.settings > span.account-id"],
      ["select", "select", "form.settings > select"],
      [
        "select",
        'input[type="checkbox"]',
        "form.settings > label:nth-of-type(2) > input",
      ],
      ["click", 'button "Save changes"', "form.settings > button.primary"],
      ["click", 'button "Dismiss"', "#toasts > button.toast-close"],
      ["scroll", null, null],
      ["resize", null, null],
      ["click", 'button "Save changes"', "form.settings > button.primary"],
      ["scroll", null, null],
      ["selection", SELECTION.label, SELECTION.selector],
    ]);
    expect(
      result
        .filter(({ detail }) => detail !== null)
        .map(({ detail }) => detail),
    ).toEqual(["checked", "to 0,800", "1024x700", "to 0,0"]);
    expect(result.every(({ offsetMs }) => offsetMs <= 0)).toBe(true);
    expect(JSON.stringify(result)).not.toContain("acct_12345");
  });
});
