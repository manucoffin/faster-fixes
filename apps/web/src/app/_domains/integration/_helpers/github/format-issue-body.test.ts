import { describe, expect, it } from "vitest";
import { formatIssueBody } from "./format-issue-body";

const feedback: Parameters<typeof formatIssueBody>[0] = {
  id: "fb_1",
  comment: "The save button does nothing",
  pageUrl: "https://example.com/settings",
  selector: "#save",
  clickX: null,
  clickY: null,
  browserName: "Chrome",
  browserVersion: "130",
  os: "macOS",
  viewportWidth: 1280,
  viewportHeight: 720,
  screenshotUrl: null,
  reviewerName: "Ada",
  metadata: null,
  diagnosticTrail: {
    console: [{ level: "error", message: "Save failed", timestamp: 0 }],
    network: [],
  },
  projectId: "proj_1",
  dashboardUrl: "https://app.example.com/inbox?feedback=fb_1",
};

const todaysOutput = [
  "> The save button does nothing",
  "",
  "**Page:** [example.com/settings](https://example.com/settings)",
  "**Element:** `#save`",
  "",
  "<details>",
  "<summary>Environment</summary>",
  "",
  "Chrome 130 · macOS · 1280 × 720",
  "Submitted by Ada",
  "",
  "</details>",
  "",
  "<details>",
  "<summary>Diagnostics (1 console, 0 network)</summary>",
  "",
  "**Console**",
  "",
  "- `error` Save failed",
  "",
  "",
  "</details>",
  "",
  '<sub><a href="https://faster-fixes.com">Faster Fixes</a> · <a href="https://app.example.com/inbox?feedback=fb_1">View in dashboard</a></sub>',
].join("\n");

describe("formatIssueBody", () => {
  it("renders a collapsible Custom metadata block after Environment, in declared order", () => {
    const body = formatIssueBody({
      ...feedback,
      customMetadata: { userId: "42", plan: "pro", beta: true, team: null },
    });

    expect(body).toBe(
      todaysOutput.replace(
        "</details>\n\n<details>\n<summary>Diagnostics",
        [
          "</details>",
          "",
          "<details>",
          "<summary>Custom metadata</summary>",
          "",
          "- userId: 42",
          "- plan: pro",
          "- beta: true",
          "- team: null",
          "",
          "</details>",
          "",
          "<details>",
          "<summary>Diagnostics",
        ].join("\n"),
      ),
    );
  });

  it.each([
    ["absent", undefined],
    ["null", null],
    ["empty", {}],
  ])("renders today's body when Custom metadata is %s", (_, customMetadata) => {
    expect(formatIssueBody({ ...feedback, customMetadata })).toBe(todaysOutput);
  });

  it("drops the page line when the Feedback has no page URL", () => {
    expect(formatIssueBody({ ...feedback, pageUrl: null })).toBe(
      todaysOutput.replace(
        "**Page:** [example.com/settings](https://example.com/settings)\n",
        "",
      ),
    );
  });
});

describe("formatIssueBody for a video Feedback", () => {
  const videoFeedback: Parameters<typeof formatIssueBody>[0] = {
    ...feedback,
    comment: "The logo jumps when the menu opens",
    pageUrl: null,
    selector: null,
    viewportWidth: null,
    viewportHeight: null,
    screenshotUrl: "https://cdn.example.com/frame.jpg?X-Amz-Expires=3600",
    reviewerName: "Curious Otter",
    metadata: { reactComponentPath: "App > Header" },
    customMetadata: { plan: "pro" },
    dashboardUrl: "https://app.example.com/videos/vid_1?feedbackId=fb_1",
    videoId: "vid_1",
    videoTitle: "Homepage walkthrough v1",
    startMs: 12340,
    endMs: null,
    frameX: 0.42,
    frameY: 0.61,
    frameWidth: null,
    frameHeight: null,
  };

  const videoBody = (videoLine: string) =>
    [
      "> The logo jumps when the menu opens",
      "",
      `**Video:** ${videoLine}`,
      "",
      "![Screenshot](https://cdn.example.com/frame.jpg?X-Amz-Expires=3600)",
      "",
      "**Reported by:** Curious Otter",
      "",
      "**Environment:** Chrome 130 · macOS",
      "",
      '<sub><a href="https://faster-fixes.com">Faster Fixes</a> · <a href="https://app.example.com/videos/vid_1?feedbackId=fb_1">View in dashboard</a></sub>',
    ].join("\n");

  it("renders the Video line with the instant and the point, and no page sections", () => {
    expect(formatIssueBody(videoFeedback)).toBe(
      videoBody("Homepage walkthrough v1 · At 0:12.340 · Point at 42%, 61%"),
    );
  });

  it("renders a range with an area", () => {
    expect(
      formatIssueBody({
        ...videoFeedback,
        startMs: 41000,
        endMs: 47500,
        frameX: 0.1,
        frameY: 0.2,
        frameWidth: 0.45,
        frameHeight: 0.5,
      }),
    ).toBe(
      videoBody(
        "Homepage walkthrough v1 · From 0:41.000 to 0:47.500 · Area from (10%, 20%) to (55%, 70%)",
      ),
    );
  });

  it("renders time only when the Reviewer marked no part of the frame", () => {
    expect(
      formatIssueBody({ ...videoFeedback, frameX: null, frameY: null }),
    ).toBe(videoBody("Homepage walkthrough v1 · At 0:12.340"));
  });

  it("drops the Screenshot and Environment when neither was captured", () => {
    const body = formatIssueBody({
      ...videoFeedback,
      screenshotUrl: null,
      browserName: null,
      browserVersion: null,
      os: null,
    });

    expect(body).not.toContain("Screenshot");
    expect(body).not.toContain("Environment");
    expect(body).toContain("**Reported by:** Curious Otter");
  });

  it("writes no Element, Custom metadata, Diagnostics or Share link", () => {
    const body = formatIssueBody(videoFeedback);

    expect(body).not.toContain("**Element:**");
    expect(body).not.toContain("Custom metadata");
    expect(body).not.toContain("Diagnostics");
    expect(body).not.toContain("/review/");
    expect(body).not.toContain("/inbox");
  });
});
