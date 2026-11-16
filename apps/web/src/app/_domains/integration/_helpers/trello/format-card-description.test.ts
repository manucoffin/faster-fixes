import { describe, expect, it } from "vitest";
import {
  type FeedbackForTrelloCard,
  formatTrelloCardDescription,
  formatTrelloCardName,
  TRELLO_DESCRIPTION_MAX_CHARACTERS,
} from "./format-card-description";

const dashboardUrl = "https://app.example.com/inbox?feedback=fb_1";

const feedback: FeedbackForTrelloCard = {
  id: "fb_1",
  comment: "The save button does nothing",
  pageUrl: "https://example.com/settings",
  selector: "#save",
  clickX: 12,
  clickY: 34,
  browserName: "Chrome",
  browserVersion: "130",
  os: "macOS",
  viewportWidth: 1280,
  viewportHeight: 720,
  reviewerName: "Ada",
  metadata: null,
  diagnosticTrail: {
    console: [{ level: "error", message: "Save failed", timestamp: 0 }],
    network: [],
  },
  customMetadata: { plan: "pro" },
  projectId: "project_1",
  dashboardUrl,
};

describe("formatTrelloCardDescription", () => {
  it("carries the page Feedback's context and ends with the dashboard link", () => {
    const description = formatTrelloCardDescription(feedback);

    expect(description.startsWith("> The save button does nothing")).toBe(true);
    expect(description).toContain(
      "**Page:** [example.com/settings](https://example.com/settings)",
    );
    expect(description).toContain("`#save` · at (12, 34)");
    expect(description).toContain("Chrome 130 · macOS · 1280 × 720");
    expect(description).toContain("Submitted by Ada");
    expect(description).toContain("plan: pro");
    expect(description).toContain("Save failed");
    expect(description.endsWith(`[View in dashboard](${dashboardUrl})`)).toBe(
      true,
    );
  });

  it("never embeds a Screenshot URL", () => {
    expect(formatTrelloCardDescription(feedback)).not.toContain("![");
  });

  it("links the Recording player when a Recording exists", () => {
    const description = formatTrelloCardDescription({
      ...feedback,
      recording: {
        playerUrl: "https://app.example.com/inbox?feedback=fb_1&player=1",
        durationMs: 12_000,
        timeline: null,
      },
    });

    expect(description).toContain(
      "**Recording:** [Play in Faster Fixes](https://app.example.com/inbox?feedback=fb_1&player=1) · 12 s",
    );
  });

  it("describes a Video Feedback by its Video and links the dashboard Video page only", () => {
    const videoDashboardUrl =
      "https://app.example.com/videos/video_1?feedback=fb_1";
    const description = formatTrelloCardDescription({
      ...feedback,
      pageUrl: null,
      selector: null,
      dashboardUrl: videoDashboardUrl,
      videoId: "video_1",
      videoTitle: "Launch film",
      startMs: 5_000,
      endMs: null,
    });

    expect(description).toContain("**Video:** Launch film");
    expect(description).not.toContain("**Page:**");
    expect(description).not.toContain("/review/");
    expect(
      description.endsWith(`[View in dashboard](${videoDashboardUrl})`),
    ).toBe(true);
  });

  it("truncates a very long Diagnostic Trail to Trello's limit and keeps the dashboard link", () => {
    const description = formatTrelloCardDescription({
      ...feedback,
      diagnosticTrail: {
        console: Array.from({ length: 2_000 }, (_, index) => ({
          level: "error" as const,
          message: `Request ${index} failed with a long explanation`,
          timestamp: index,
        })),
        network: [],
      },
    });

    expect(description.length).toBeLessThanOrEqual(
      TRELLO_DESCRIPTION_MAX_CHARACTERS,
    );
    expect(description).toContain(
      "_Truncated. The full report is in the dashboard._",
    );
    expect(description.endsWith(`[View in dashboard](${dashboardUrl})`)).toBe(
      true,
    );
  });

  it("leaves a description under the limit untouched", () => {
    expect(formatTrelloCardDescription(feedback)).not.toContain("Truncated");
  });
});

describe("formatTrelloCardName", () => {
  it("flattens the comment to one line", () => {
    expect(formatTrelloCardName("Broken\nsave  button")).toBe(
      "Broken save button",
    );
  });
});
