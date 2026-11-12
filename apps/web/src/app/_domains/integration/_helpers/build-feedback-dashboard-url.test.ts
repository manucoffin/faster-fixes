import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildFeedbackDashboardUrl } from "./build-feedback-dashboard-url";

describe("buildFeedbackDashboardUrl", () => {
  beforeEach(() => {
    vi.stubEnv("BETTER_AUTH_URL", "https://app.example.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("opens the Video page at the Feedback for a video Feedback", () => {
    expect(
      buildFeedbackDashboardUrl({ id: "feedback-1", videoId: "video-1" }),
    ).toBe("https://app.example.com/videos/video-1?feedbackId=feedback-1");
  });

  it("opens the inbox at the Feedback for a page Feedback", () => {
    expect(buildFeedbackDashboardUrl({ id: "feedback-1", videoId: null })).toBe(
      "https://app.example.com/inbox?feedbackId=feedback-1",
    );
  });

  it("opens the inbox at the Feedback with the player open when asked", () => {
    expect(
      buildFeedbackDashboardUrl(
        { id: "feedback-1", videoId: null },
        { player: true },
      ),
    ).toBe("https://app.example.com/inbox?feedbackId=feedback-1&player=true");
  });

  it("keeps the Video page address for a video Feedback asked for the player", () => {
    expect(
      buildFeedbackDashboardUrl(
        { id: "feedback-1", videoId: "video-1" },
        { player: true },
      ),
    ).toBe("https://app.example.com/videos/video-1?feedbackId=feedback-1");
  });
});
