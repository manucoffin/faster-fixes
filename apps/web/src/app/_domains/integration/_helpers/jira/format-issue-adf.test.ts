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
});
