import { describe, expect, it } from "vitest";
import { type FeedbackForJiraIssue, formatIssueAdf } from "./format-issue-adf";

const feedback: FeedbackForJiraIssue = {
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
  dashboardUrl: "https://app.example.com/inbox?feedback=fb_1",
};

function expandTitles(doc: ReturnType<typeof formatIssueAdf>): string[] {
  return doc.content.flatMap((node) =>
    node.type === "expand" ? [node.attrs.title] : [],
  );
}

describe("formatIssueAdf", () => {
  it("renders a Custom metadata expand after Environment with one bullet per pair, in declared order", () => {
    const doc = formatIssueAdf({
      ...feedback,
      customMetadata: { userId: "42", plan: "pro", beta: true, team: null },
    });

    expect(expandTitles(doc)).toEqual([
      "Environment",
      "Custom metadata",
      "Diagnostics (1 console, 0 network)",
    ]);
    expect(
      doc.content.find(
        (node) =>
          node.type === "expand" && node.attrs.title === "Custom metadata",
      ),
    ).toEqual({
      type: "expand",
      attrs: { title: "Custom metadata" },
      content: [
        {
          type: "bulletList",
          content: ["userId: 42", "plan: pro", "beta: true", "team: null"].map(
            (line) => ({
              type: "listItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: line }] },
              ],
            }),
          ),
        },
      ],
    });
  });

  it.each([
    ["null", null],
    ["empty", {}],
  ])(
    "renders today's document when Custom metadata is %s",
    (_, customMetadata) => {
      expect(formatIssueAdf({ ...feedback, customMetadata })).toEqual(
        formatIssueAdf(feedback),
      );
      expect(expandTitles(formatIssueAdf(feedback))).toEqual([
        "Environment",
        "Diagnostics (1 console, 0 network)",
      ]);
    },
  );

  it("drops the Page paragraph when the Feedback has no page URL", () => {
    const withPage = formatIssueAdf(feedback);
    const withoutPage = formatIssueAdf({ ...feedback, pageUrl: null });

    expect(withoutPage.content).toHaveLength(withPage.content.length - 1);
    expect(JSON.stringify(withoutPage)).not.toContain("Page: ");
    expect(JSON.stringify(withoutPage)).not.toContain("null");
  });
});

describe("formatIssueAdf for a video Feedback", () => {
  const videoFeedback: FeedbackForJiraIssue = {
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

  const labelled = (label: string, value: string) => ({
    type: "paragraph",
    content: [
      { type: "text", text: label, marks: [{ type: "strong" }] },
      { type: "text", text: value },
    ],
  });

  const videoDocument = (videoLine: string) => ({
    version: 1,
    type: "doc",
    content: [
      {
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "The logo jumps when the menu opens" },
            ],
          },
        ],
      },
      labelled("Video: ", videoLine),
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Screenshot: ", marks: [{ type: "strong" }] },
          {
            type: "text",
            text: "view",
            marks: [
              {
                type: "link",
                attrs: {
                  href: "https://cdn.example.com/frame.jpg?X-Amz-Expires=3600",
                },
              },
            ],
          },
        ],
      },
      labelled("Reported by: ", "Curious Otter"),
      labelled("Environment: ", "Chrome 130 · macOS"),
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Faster Fixes",
            marks: [
              { type: "link", attrs: { href: "https://faster-fixes.com" } },
            ],
          },
          { type: "text", text: " · ", marks: [{ type: "em" }] },
          {
            type: "text",
            text: "View in dashboard",
            marks: [
              {
                type: "link",
                attrs: {
                  href: "https://app.example.com/videos/vid_1?feedbackId=fb_1",
                },
              },
            ],
          },
        ],
      },
    ],
  });

  it("renders the Video paragraph with the instant and the point, in order", () => {
    expect(formatIssueAdf(videoFeedback)).toEqual(
      videoDocument(
        "Homepage walkthrough v1 · At 0:12.340 · Point at 42%, 61%",
      ),
    );
  });

  it("renders a range with an area", () => {
    expect(
      formatIssueAdf({
        ...videoFeedback,
        startMs: 41000,
        endMs: 47500,
        frameX: 0.1,
        frameY: 0.2,
        frameWidth: 0.45,
        frameHeight: 0.5,
      }),
    ).toEqual(
      videoDocument(
        "Homepage walkthrough v1 · From 0:41.000 to 0:47.500 · Area from (10%, 20%) to (55%, 70%)",
      ),
    );
  });

  it("renders time only when the Reviewer marked no part of the frame", () => {
    expect(
      formatIssueAdf({ ...videoFeedback, frameX: null, frameY: null }),
    ).toEqual(videoDocument("Homepage walkthrough v1 · At 0:12.340"));
  });

  it("drops the Screenshot and Environment when neither was captured", () => {
    const json = JSON.stringify(
      formatIssueAdf({
        ...videoFeedback,
        screenshotUrl: null,
        browserName: null,
        browserVersion: null,
        os: null,
      }),
    );

    expect(json).not.toContain("Screenshot");
    expect(json).not.toContain("Environment");
    expect(json).toContain("Reported by: ");
  });

  it("writes no expand, Element, Share link or inbox link", () => {
    const doc = formatIssueAdf(videoFeedback);
    const json = JSON.stringify(doc);

    expect(expandTitles(doc)).toEqual([]);
    expect(json).not.toContain("Element: ");
    expect(json).not.toContain("/review/");
    expect(json).not.toContain("/inbox");
  });
});
