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
});
