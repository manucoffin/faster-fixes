import { describe, expect, it } from "vitest";
import {
  type FeedbackForMarkdown,
  formatFeedbackAsMarkdown,
} from "./format-feedback-markdown";

const feedback: FeedbackForMarkdown = {
  id: "fb_1",
  status: "new",
  comment: "The save button does nothing",
  pageUrl: "https://example.com/settings",
  selector: "#save",
  clickX: null,
  clickY: null,
  viewportWidth: 1280,
  viewportHeight: 720,
  browserName: "Chrome",
  browserVersion: "130",
  os: "macOS",
  screenshotUrl: null,
  metadata: null,
  diagnosticTrail: {
    console: [{ level: "error", message: "Save failed", timestamp: 0 }],
    network: [],
  },
};

const todaysOutput = [
  "# Feedback fb_1",
  "",
  "**Status:** new",
  "",
  "A user left feedback on your application. Review and address the issue described below.",
  "",
  "## Where to look",
  "",
  "**Page URL:** https://example.com/settings",
  "**DOM selector:** `#save`",
  "",
  "## What's wrong",
  "",
  "> The save button does nothing",
  "",
  "## Environment",
  "",
  "**Browser:** Chrome 130",
  "**OS:** macOS",
  "**Viewport:** 1280×720",
  "",
  "## Diagnostics",
  "",
  "**Console**",
  "",
  "- `error` Save failed",
  "",
].join("\n");

describe("formatFeedbackAsMarkdown", () => {
  it("renders Custom metadata between Environment and Diagnostics, in declared order", () => {
    const markdown = formatFeedbackAsMarkdown({
      ...feedback,
      customMetadata: {
        userId: "user_42",
        plan: null,
        beta: true,
        seats: 3,
      },
    });

    expect(markdown).toContain(
      [
        "**Viewport:** 1280×720",
        "",
        "## Custom metadata",
        "",
        "- userId: user_42",
        "- plan: null",
        "- beta: true",
        "- seats: 3",
        "",
        "## Diagnostics",
      ].join("\n"),
    );
  });

  it("keeps a multi-line value on one bullet", () => {
    const markdown = formatFeedbackAsMarkdown({
      ...feedback,
      customMetadata: { note: "first\n  second" },
    });

    expect(markdown).toContain("- note: first second");
  });

  it.each([
    ["absent", undefined],
    ["null", null],
    ["empty", {}],
  ])("matches today's output when Custom metadata is %s", (_, value) => {
    expect(
      formatFeedbackAsMarkdown({ ...feedback, customMetadata: value }),
    ).toBe(todaysOutput);
  });

  it("drops the page line when the Feedback has no page URL", () => {
    expect(formatFeedbackAsMarkdown({ ...feedback, pageUrl: null })).toBe(
      todaysOutput.replace("**Page URL:** https://example.com/settings\n", ""),
    );
  });

  it("drops the Where to look section when nothing locates the Feedback", () => {
    const markdown = formatFeedbackAsMarkdown({
      ...feedback,
      pageUrl: null,
      selector: null,
    });

    expect(markdown).not.toContain("## Where to look");
    expect(markdown).not.toContain("null");
  });
});

describe("formatFeedbackAsMarkdown with a Recording", () => {
  const SELECTION_AT = 1_794_400_060_000;
  const recording = {
    readable: true,
    steps: [
      {
        type: "click" as const,
        timestamp: SELECTION_AT - 12_400,
        offsetMs: -12_400,
        label: 'button "Save changes"',
        selector: "form.settings > button.primary",
        detail: null,
      },
      {
        type: "selection" as const,
        timestamp: SELECTION_AT,
        offsetMs: 0,
        label: 'button "Save changes"',
        selector: "#save",
        detail: null,
      },
    ],
  };
  const withTrail: FeedbackForMarkdown = {
    ...feedback,
    diagnosticTrail: {
      console: [
        {
          level: "error",
          message: "Save failed",
          timestamp: SELECTION_AT - 11_000,
        },
      ],
      network: [
        {
          method: "POST",
          url: "https://example.com/api/settings",
          status: 500,
          duration: 120,
          timestamp: SELECTION_AT - 12_000,
        },
      ],
    },
  };

  it("puts the Timeline in place of Diagnostics, ending with the Selection", () => {
    const markdown = formatFeedbackAsMarkdown({ ...withTrail, recording });

    expect(markdown).not.toContain("## Diagnostics");
    expect(markdown).toContain(
      [
        "## Timeline",
        "",
        '- -12.4 s  click button "Save changes" (form.settings > button.primary)',
        "- -12.0 s  `POST` https://example.com/api/settings → 500 (120ms)",
        "- -11.0 s  `error` Save failed",
        '- 0.0 s  selection button "Save changes" (#save), the element the comment is about',
      ].join("\n"),
    );
  });

  it("keeps Diagnostics and says so when the Recording could not be read", () => {
    const markdown = formatFeedbackAsMarkdown({
      ...feedback,
      recording: { readable: false, steps: [] },
    });

    expect(markdown).toBe(
      `${todaysOutput}\n**Recording:** the file could not be read, so this Feedback has no timeline.`,
    );
  });

  it("says the Recording could not be read without a Diagnostic Trail", () => {
    const markdown = formatFeedbackAsMarkdown({
      ...feedback,
      diagnosticTrail: null,
      recording: { readable: false, steps: [] },
    });

    expect(markdown).toContain(
      "**Viewport:** 1280×720\n\n**Recording:** the file could not be read",
    );
  });

  it.each([
    ["absent", undefined],
    ["null", null],
  ])("matches today's output when the Recording is %s", (_, value) => {
    expect(formatFeedbackAsMarkdown({ ...feedback, recording: value })).toBe(
      todaysOutput,
    );
  });
});

describe("formatFeedbackAsMarkdown on a video Feedback", () => {
  const videoFeedback: FeedbackForMarkdown = {
    ...feedback,
    pageUrl: null,
    selector: null,
    viewportWidth: null,
    viewportHeight: null,
    diagnosticTrail: null,
    videoId: "video_1",
    videoTitle: "Homepage walkthrough v1",
    selection: {
      startMs: 12340,
      endMs: null,
      point: { x: 0.42, y: 0.61 },
      area: null,
    },
  };

  it("says the Video, the instant and the point in Where to look", () => {
    expect(formatFeedbackAsMarkdown(videoFeedback)).toContain(
      [
        "## Where to look",
        "",
        "**Video:** Homepage walkthrough v1",
        "**When:** At 00:12.340 (12340 ms)",
        "**Where on the frame:** Point at 42%, 61%",
        "",
        "## What's wrong",
        "",
        "> The save button does nothing",
        "",
        "## Environment",
        "",
        "**Browser:** Chrome 130",
        "**OS:** macOS",
      ].join("\n"),
    );
  });

  it("words a range with an area", () => {
    const markdown = formatFeedbackAsMarkdown({
      ...videoFeedback,
      selection: {
        startMs: 41000,
        endMs: 47500,
        point: null,
        area: { x: 0.1, y: 0.2, width: 0.45, height: 0.5 },
      },
    });

    expect(markdown).toContain(
      [
        "**When:** From 00:41.000 to 00:47.500 (41000 to 47500 ms)",
        "**Where on the frame:** Area from (10%, 20%) to (55%, 70%)",
      ].join("\n"),
    );
  });

  it("omits the frame line when the Reviewer marked time only", () => {
    const markdown = formatFeedbackAsMarkdown({
      ...videoFeedback,
      selection: { startMs: 12340, endMs: null, point: null, area: null },
    });

    expect(markdown).toContain(
      "**When:** At 00:12.340 (12340 ms)\n\n## What's wrong",
    );
    expect(markdown).not.toContain("Where on the frame");
  });

  it("prefixes the hours past an hour", () => {
    const markdown = formatFeedbackAsMarkdown({
      ...videoFeedback,
      selection: { startMs: 3_723_004, endMs: null, point: null, area: null },
    });

    expect(markdown).toContain("**When:** At 01:02:03.004 (3723004 ms)");
  });

  it("keeps the Screenshot section for the captured frame", () => {
    const markdown = formatFeedbackAsMarkdown({
      ...videoFeedback,
      screenshotUrl: "https://assets.example.test/frame.jpg",
    });

    expect(markdown).toContain(
      "![Feedback screenshot](https://assets.example.test/frame.jpg)",
    );
  });

  it("renders a page Feedback with null video fields as today", () => {
    expect(
      formatFeedbackAsMarkdown({
        ...feedback,
        videoId: null,
        videoTitle: null,
        selection: null,
      }),
    ).toBe(todaysOutput);
  });
});
