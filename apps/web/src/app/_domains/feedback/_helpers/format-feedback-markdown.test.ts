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
