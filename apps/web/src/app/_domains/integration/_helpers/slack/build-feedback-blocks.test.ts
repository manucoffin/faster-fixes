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
});
