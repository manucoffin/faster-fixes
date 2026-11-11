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

  describe("video Feedback", () => {
    const videoFeedback = {
      reviewerName: "Curious Otter",
      comment: "The logo jumps when the menu opens",
      pageUrl: null,
      browserName: "Chrome",
      os: "macOS",
      videoId: "vid_1",
      videoTitle: "Homepage walkthrough v1",
      startMs: 12_340,
      endMs: null as number | null,
      frameX: null as number | null,
      frameY: null as number | null,
      frameWidth: null as number | null,
      frameHeight: null as number | null,
    };
    const dashboardUrl = "https://app.example.com/videos/vid_1?feedbackId=fb_1";

    function build(overrides: Partial<typeof videoFeedback> = {}) {
      return buildFeedbackBlocks({
        feedback: { ...videoFeedback, ...overrides },
        status: "new",
        actor: "human",
        dashboardUrl,
        screenshotUrl: "https://cdn.example.com/frame.jpg?sig=1",
      }).blocks;
    }

    function sourceLine(blocks: Record<string, unknown>[]) {
      const context = blocks.find((block) => block.type === "context");
      return (context?.elements as { text: string }[])[0]?.text;
    }

    it("names the Video, the instant and the point on the frame", () => {
      expect(sourceLine(build({ frameX: 0.42, frameY: 0.61 }))).toBe(
        "Homepage walkthrough v1 · At 0:12.340 · Point at 42%, 61%",
      );
    });

    it("names the range and the area on the frame", () => {
      expect(
        sourceLine(
          build({
            startMs: 41_000,
            endMs: 47_500,
            frameX: 0.1,
            frameY: 0.2,
            frameWidth: 0.45,
            frameHeight: 0.5,
          }),
        ),
      ).toBe(
        "Homepage walkthrough v1 · From 0:41.000 to 0:47.500 · Area from (10%, 20%) to (55%, 70%)",
      );
    });

    it("names only the Video and the time when nothing is marked on the frame", () => {
      expect(sourceLine(build())).toBe("Homepage walkthrough v1 · At 0:12.340");
    });

    it("shows the captured frame and opens the Video page", () => {
      const blocks = build();

      expect(blocks).toContainEqual({
        type: "image",
        image_url: "https://cdn.example.com/frame.jpg?sig=1",
        alt_text: "Video frame",
      });
      expect(blocks.at(-1)).toEqual({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `<${dashboardUrl}|Open in Faster Fixes>`,
        },
        accessory: {
          type: "button",
          text: { type: "plain_text", text: "Open in Faster Fixes" },
          url: dashboardUrl,
        },
      });
    });

    it("keeps the environment after the source line", () => {
      const context = build().find((block) => block.type === "context");
      expect(context?.elements).toEqual([
        { type: "mrkdwn", text: "Homepage walkthrough v1 · At 0:12.340" },
        { type: "mrkdwn", text: "Chrome · macOS" },
      ]);
    });
  });

  it("renders a page Feedback with its page link and screenshot", () => {
    const { blocks } = buildFeedbackBlocks({
      feedback: {
        reviewerName: "Ada",
        comment: "The save button does nothing",
        pageUrl: "https://example.com/settings",
        browserName: "Chrome",
        os: "macOS",
      },
      status: "new",
      actor: "human",
      dashboardUrl: "https://app.example.com/inbox?feedbackId=fb_1",
      screenshotUrl: "https://cdn.example.com/shot.png",
    });

    expect(blocks).toEqual([
      {
        type: "section",
        text: { type: "mrkdwn", text: "*Ada*\nThe save button does nothing" },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "<https://example.com/settings|https://example.com/settings>",
          },
          { type: "mrkdwn", text: "Chrome · macOS" },
        ],
      },
      {
        type: "image",
        image_url: "https://cdn.example.com/shot.png",
        alt_text: "Feedback screenshot",
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: "*Status:* 🆕 New" },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "<https://app.example.com/inbox?feedbackId=fb_1|Open in Faster Fixes>",
        },
        accessory: {
          type: "button",
          text: { type: "plain_text", text: "Open in Faster Fixes" },
          url: "https://app.example.com/inbox?feedbackId=fb_1",
        },
      },
    ]);
  });

  describe("page Feedback with a Recording", () => {
    const feedback = {
      reviewerName: "Ada",
      comment: "The save button does nothing",
      pageUrl: "https://example.com/settings",
      browserName: "Chrome",
      os: "macOS",
    };
    const dashboardUrl = "https://app.example.com/inbox?feedbackId=fb_1";
    const playerUrl =
      "https://app.example.com/inbox?feedbackId=fb_1&player=true";

    function build(link: string | null) {
      return buildFeedbackBlocks({
        feedback,
        status: "new",
        actor: "human",
        dashboardUrl,
        playerUrl: link,
        screenshotUrl: null,
      });
    }

    it("puts Play recording beside Open in Faster Fixes", () => {
      expect(build(playerUrl).blocks.at(-1)).toEqual({
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Open in Faster Fixes" },
            url: dashboardUrl,
          },
          {
            type: "button",
            text: { type: "plain_text", text: "Play recording" },
            url: playerUrl,
          },
        ],
      });
    });

    it("says nothing else about the Recording and keeps the fallback text", () => {
      const withRecording = build(playerUrl);
      const without = build(null);

      expect(withRecording.text).toBe(without.text);
      expect(withRecording.blocks.slice(0, -1)).toEqual(
        without.blocks.slice(0, -1),
      );
      const announcement = JSON.stringify(withRecording).toLowerCase();
      for (const fragment of ["timeline", "diagnostic", "duration"]) {
        expect(announcement).not.toContain(fragment);
      }
    });

    it("keeps today's single button without a player link", () => {
      expect(build(null).blocks.at(-1)).toEqual({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `<${dashboardUrl}|Open in Faster Fixes>`,
        },
        accessory: {
          type: "button",
          text: { type: "plain_text", text: "Open in Faster Fixes" },
          url: dashboardUrl,
        },
      });
    });
  });
});
