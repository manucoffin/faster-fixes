import { mergeRecordingTimeline } from "@/app/_domains/feedback";
import { describe, expect, it } from "vitest";
import { formatIssueBody } from "../github/format-issue-body";
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

describe("formatIssueAdf with a Recording", () => {
  const SELECTION_AT = 1_794_400_060_000;
  const steps = [
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
  ];
  const withTrail: FeedbackForJiraIssue = {
    ...feedback,
    screenshotUrl: "https://cdn.example.com/shot.png",
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
  const playerUrl = "https://app.example.com/inbox?feedbackId=fb_1&player=true";
  const recording = {
    playerUrl,
    durationMs: 48_300,
    timeline: mergeRecordingTimeline({
      steps,
      diagnosticTrail: withTrail.diagnosticTrail,
    }),
  };

  const recordingParagraph = (duration: string) => ({
    type: "paragraph",
    content: [
      { type: "text", text: "Recording: ", marks: [{ type: "strong" }] },
      {
        type: "text",
        text: "Play in Faster Fixes",
        marks: [{ type: "link", attrs: { href: playerUrl } }],
      },
      { type: "text", text: ` · ${duration}` },
    ],
  });

  const item = (...content: unknown[]) => ({
    type: "listItem",
    content: [{ type: "paragraph", content }],
  });

  // First words of each top-level node, to compare section order.
  const sections = (doc: ReturnType<typeof formatIssueAdf>) =>
    doc.content.map((node) => {
      if (node.type === "expand") return node.attrs.title.split(" ")[0] ?? "";
      if (node.type === "blockquote") return "Comment";
      const first = node.type === "paragraph" ? node.content?.[0] : undefined;
      return first?.type === "text" ? first.text.replace(/: $/, "") : "";
    });

  it("puts the Recording paragraph after Element and the Timeline in place of Diagnostics", () => {
    const doc = formatIssueAdf({ ...withTrail, recording });

    expect(sections(doc)).toEqual([
      "Comment",
      "Page",
      "Element",
      "Recording",
      "Screenshot",
      "Environment",
      "Timeline",
      "Faster Fixes",
    ]);
    expect(doc.content[3]).toEqual(recordingParagraph("48 s"));
    expect(doc.content[6]).toEqual({
      type: "expand",
      attrs: { title: "Timeline (2 steps, 1 console, 1 network)" },
      content: [
        {
          type: "bulletList",
          content: [
            item(
              { type: "text", text: "-12.4 s  " },
              {
                type: "text",
                text: 'click button "Save changes" (form.settings > button.primary)',
              },
            ),
            item(
              { type: "text", text: "-12.0 s  " },
              { type: "text", text: "POST", marks: [{ type: "code" }] },
              {
                type: "text",
                text: " https://example.com/api/settings → 500 (120ms)",
              },
            ),
            item(
              { type: "text", text: "-11.0 s  " },
              { type: "text", text: "error", marks: [{ type: "code" }] },
              { type: "text", text: " Save failed" },
            ),
            item(
              { type: "text", text: "0.0 s  " },
              {
                type: "text",
                text: 'selection button "Save changes" (#save), the element the comment is about',
              },
            ),
          ],
        },
      ],
    });
  });

  it("orders its sections as the GitHub body does", () => {
    const githubSections = formatIssueBody({
      ...withTrail,
      id: "fb_1",
      projectId: "prj_1",
      recording,
    })
      .split("\n")
      .flatMap((line) => {
        const label = /^\*\*(\w+):\*\*/.exec(line)?.[1];
        if (label) return [label];
        const summary = /^<summary>(\w+)/.exec(line)?.[1];
        if (summary) return [summary];
        if (line.startsWith("![Screenshot]")) return ["Screenshot"];
        return [];
      });

    expect(
      sections(formatIssueAdf({ ...withTrail, recording })).filter((section) =>
        githubSections.includes(section),
      ),
    ).toEqual(githubSections);
  });

  it("prints a sub-second Recording as 1 s", () => {
    expect(
      formatIssueAdf({
        ...feedback,
        recording: { ...recording, durationMs: 300 },
      }).content,
    ).toContainEqual(recordingParagraph("1 s"));
  });

  it("states the omitted entries before the list", () => {
    const doc = formatIssueAdf({
      ...feedback,
      recording: {
        ...recording,
        timeline: { ...recording.timeline, droppedCount: 3 },
      },
    });
    const timeline = doc.content.find(
      (node) =>
        node.type === "expand" && node.attrs.title.startsWith("Timeline"),
    );

    expect(timeline?.type === "expand" && timeline.content[0]).toEqual({
      type: "paragraph",
      content: [{ type: "text", text: "3 earlier entries omitted." }],
    });
  });

  it("keeps the paragraph and Diagnostics as today when the Recording cannot be read", () => {
    const today = formatIssueAdf(feedback);
    const doc = formatIssueAdf({
      ...feedback,
      recording: { playerUrl, durationMs: 48_300, timeline: null },
    });

    expect(doc.content).toEqual([
      ...today.content.slice(0, 3),
      recordingParagraph("48 s"),
      ...today.content.slice(3),
    ]);
  });

  it("renders today's document when the Feedback has no Recording", () => {
    expect(formatIssueAdf({ ...feedback, recording: null })).toEqual(
      formatIssueAdf(feedback),
    );
  });

  it("renders a video Feedback exactly as today", () => {
    const videoFeedback = { ...feedback, videoId: "vid_1", videoTitle: "Demo" };

    expect(formatIssueAdf({ ...videoFeedback, recording })).toEqual(
      formatIssueAdf(videoFeedback),
    );
  });

  it("keeps a full capped Timeline of typical entries whole", () => {
    const timeline = mergeRecordingTimeline({
      steps: [
        ...Array.from({ length: 59 }, (_, index) => ({
          ...steps[0]!,
          timestamp: SELECTION_AT - 60_000 + index * 1_000,
          offsetMs: -60_000 + index * 1_000,
        })),
        steps[1]!,
      ],
      diagnosticTrail: {
        console: Array.from({ length: 30 }, (_, index) => ({
          level: "error" as const,
          message:
            "TypeError: Cannot read properties of undefined (reading 'id')",
          timestamp: SELECTION_AT - 59_500 + index * 2_000,
        })),
        network: Array.from({ length: 30 }, (_, index) => ({
          method: "GET",
          url: "https://example.com/api/projects/prj_1/settings?include=members",
          status: 200,
          duration: 84,
          timestamp: SELECTION_AT - 58_500 + index * 2_000,
        })),
      },
      maxEntries: 120,
    });

    const doc = formatIssueAdf({
      ...feedback,
      recording: { ...recording, timeline },
    });

    expect(JSON.stringify(doc).length).toBeLessThanOrEqual(32_767);
    expect(expandTitles(doc)).toContain(
      "Timeline (60 steps, 30 console, 30 network)",
    );
  });

  it("drops the earliest entries and says so when the description would pass Jira's limit", () => {
    const message = "x".repeat(2_000);
    const timeline = mergeRecordingTimeline({
      steps,
      diagnosticTrail: {
        console: Array.from({ length: 40 }, (_, index) => ({
          level: "log" as const,
          message,
          timestamp: SELECTION_AT - 40_000 + index * 1_000,
        })),
        network: [],
      },
    });

    const doc = formatIssueAdf({
      ...feedback,
      recording: { ...recording, timeline },
    });
    const json = JSON.stringify(doc);

    expect(json.length).toBeLessThanOrEqual(32_767);
    expect(expandTitles(doc)).toContain(
      "Timeline (2 steps, 14 console, 0 network)",
    );
    expect(json).toContain("26 earlier entries omitted.");
    expect(json).toContain(", the element the comment is about");
  });
});
