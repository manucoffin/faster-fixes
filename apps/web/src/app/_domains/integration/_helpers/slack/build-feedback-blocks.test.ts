import { describe, expect, it } from "vitest";
import { buildFeedbackBlocks } from "./build-feedback-blocks";

describe("buildFeedbackBlocks", () => {
  it("never puts Custom metadata in the announcement", () => {
    // A full Feedback row, as a caller could hand over, carrying Custom metadata.
    const feedback = {
      reviewerName: "Ada",
      comment: "The save button does nothing",
      pageUrl: "https://example.com/settings",
      browserName: "Chrome",
      os: "macOS",
      customMetadata: { userKey: "user-42-secret", tenantKey: "acme-tenant" },
    };

    const { blocks, text } = buildFeedbackBlocks({
      feedback,
      status: "new",
      actor: "human",
      dashboardUrl: "https://app.example.com/inbox?feedback=fb_1",
      screenshotUrl: null,
    });

    const announcement = JSON.stringify({ blocks, text });
    for (const fragment of [
      "userKey",
      "user-42-secret",
      "tenantKey",
      "acme-tenant",
      "Custom metadata",
    ]) {
      expect(announcement).not.toContain(fragment);
    }
  });

  it("leaves the page link out when the Feedback has no page URL", () => {
    const { blocks } = buildFeedbackBlocks({
      feedback: {
        reviewerName: "Ada",
        comment: "The cut at 0:42 is too abrupt",
        pageUrl: null,
        browserName: "Chrome",
        os: "macOS",
      },
      status: "new",
      actor: "human",
      dashboardUrl: "https://app.example.com/inbox?feedback=fb_1",
      screenshotUrl: null,
    });

    expect(blocks.filter((block) => block.type === "context")).toEqual([
      {
        type: "context",
        elements: [{ type: "mrkdwn", text: "Chrome · macOS" }],
      },
    ]);
  });

  it("leaves the context block out when there is nothing to put in it", () => {
    const { blocks } = buildFeedbackBlocks({
      feedback: {
        reviewerName: "Ada",
        comment: "The cut at 0:42 is too abrupt",
        pageUrl: null,
        browserName: null,
        os: null,
      },
      status: "new",
      actor: "human",
      dashboardUrl: "https://app.example.com/inbox?feedback=fb_1",
      screenshotUrl: null,
    });

    expect(blocks.some((block) => block.type === "context")).toBe(false);
  });
});
