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
});
