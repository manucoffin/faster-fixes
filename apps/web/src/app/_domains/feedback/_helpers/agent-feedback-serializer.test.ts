import { describe, expect, it } from "vitest";
import {
  toAgentFeedbackItem,
  toAgentVideoBlock,
} from "./agent-feedback-serializer";

const SCREENSHOT_URL = "https://assets.example.test/signed";

const noVideo = {
  videoId: null,
  startMs: null,
  endMs: null,
  frameX: null,
  frameY: null,
  frameWidth: null,
  frameHeight: null,
};

const pageRow = {
  id: "feedback_1",
  status: "new",
  comment: "The submit button does nothing",
  ...noVideo,
  pageUrl: "https://client.test/checkout",
  selector: "#submit",
  clickX: 12,
  clickY: 34,
  viewportWidth: 1280,
  viewportHeight: 800,
  browserName: "Chrome",
  browserVersion: "120",
  os: "macOS",
  metadata: { source: "bugherd" },
  diagnosticTrail: null,
  customMetadata: { userId: "user_42", beta: true },
  reviewer: { name: "Dana" },
  createdAt: new Date("2026-01-02T03:04:05.000Z"),
};

function videoRow(overrides: Record<string, unknown> = {}) {
  return {
    ...pageRow,
    id: "feedback_2",
    comment: "The logo jumps when the menu opens",
    videoId: "video_1",
    pageUrl: null,
    selector: null,
    clickX: null,
    clickY: null,
    viewportWidth: null,
    viewportHeight: null,
    startMs: 12_340,
    // Page context a video Feedback never carries, even if a row holds it.
    metadata: { source: "bugherd" },
    diagnosticTrail: { console: [], network: [] },
    customMetadata: { plan: "pro" },
    ...overrides,
  };
}

describe("toAgentFeedbackItem", () => {
  it("leaves a page item as the agent API returned it, with null video keys", () => {
    expect(toAgentFeedbackItem(pageRow, SCREENSHOT_URL)).toEqual({
      id: "feedback_1",
      status: "new",
      comment: "The submit button does nothing",
      videoId: null,
      pageUrl: "https://client.test/checkout",
      selection: null,
      selector: "#submit",
      clickX: 12,
      clickY: 34,
      viewportWidth: 1280,
      viewportHeight: 800,
      browserName: "Chrome",
      browserVersion: "120",
      os: "macOS",
      screenshotUrl: SCREENSHOT_URL,
      metadata: { source: "bugherd" },
      diagnosticTrail: null,
      customMetadata: { userId: "user_42", beta: true },
      reviewerName: "Dana",
      createdAt: new Date("2026-01-02T03:04:05.000Z"),
    });
  });

  it("reads an instant with a point from the flat columns", () => {
    const item = toAgentFeedbackItem(
      videoRow({ frameX: 0.42, frameY: 0.61 }),
      SCREENSHOT_URL,
    );

    expect(item.selection).toEqual({
      startMs: 12_340,
      endMs: null,
      point: { x: 0.42, y: 0.61 },
      area: null,
    });
  });

  it("reads a range with an area from the flat columns", () => {
    const item = toAgentFeedbackItem(
      videoRow({
        startMs: 41_000,
        endMs: 47_500,
        frameX: 0.1,
        frameY: 0.2,
        frameWidth: 0.45,
        frameHeight: 0.5,
      }),
      SCREENSHOT_URL,
    );

    expect(item.selection).toEqual({
      startMs: 41_000,
      endMs: 47_500,
      point: null,
      area: { x: 0.1, y: 0.2, width: 0.45, height: 0.5 },
    });
  });

  it("reads time only when the Reviewer marked no part of the frame", () => {
    const item = toAgentFeedbackItem(videoRow({ endMs: 15_000 }), null);

    expect(item.selection).toEqual({
      startMs: 12_340,
      endMs: 15_000,
      point: null,
      area: null,
    });
  });

  it("nulls the page fields of a video item", () => {
    const item = toAgentFeedbackItem(videoRow(), SCREENSHOT_URL);

    expect(item).toMatchObject({
      videoId: "video_1",
      pageUrl: null,
      selector: null,
      clickX: null,
      clickY: null,
      viewportWidth: null,
      viewportHeight: null,
      metadata: null,
      diagnosticTrail: null,
      customMetadata: null,
      browserName: "Chrome",
    });
  });

  it("keeps the page geometry a video item captured", () => {
    const item = toAgentFeedbackItem(
      videoRow({ viewportWidth: 1440, viewportHeight: 900 }),
      SCREENSHOT_URL,
    );

    expect(item).toMatchObject({ viewportWidth: 1440, viewportHeight: 900 });
  });
});

describe("toAgentVideoBlock", () => {
  it("keeps what converts normalized coordinates to pixels and nothing else", () => {
    expect(
      toAgentVideoBlock({
        id: "video_1",
        title: "Homepage walkthrough v1",
        filename: "homepage-walkthrough.mp4",
        durationMs: 94_200,
        width: 1920,
        height: 1080,
        size: 48_000_000n,
        videoCodec: "avc1",
      } as Parameters<typeof toAgentVideoBlock>[0]),
    ).toEqual({
      id: "video_1",
      title: "Homepage walkthrough v1",
      filename: "homepage-walkthrough.mp4",
      durationMs: 94_200,
      width: 1920,
      height: 1080,
    });
  });
});
