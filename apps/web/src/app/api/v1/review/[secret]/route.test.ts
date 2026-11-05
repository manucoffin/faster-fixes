/**
 * Contract tests for `GET /api/v1/review/:secret`, the read the public review
 * page renders from. They assert on responses only, never on how the handler
 * reaches them.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  blockRateLimit,
  CREATED_AT,
  FEEDBACK_ID,
  feedbackRow,
  OTHER_REVIEWER_ID,
  OTHER_REVIEWER_NAME,
  OTHER_REVIEWER_SECRET,
  otherReviewerRow,
  resetReviewApiDoubles,
  REVIEWER_ID,
  REVIEWER_NAME,
  reviewApiTables,
  reviewRequest,
  reviewRouteParams,
  reviewUrl,
  SCREENSHOT_KEY,
  signedUrl,
  VIDEO_FILE_KEY,
  VIDEO_ID,
  VIDEO_POSTER_KEY,
  VIDEO_TITLE,
  videoRow,
} from "../_helpers/review-api-test-doubles";

vi.mock("@workspace/db", async () => {
  const { reviewApiPrisma } =
    await import("../_helpers/review-api-test-doubles");
  return { prisma: reviewApiPrisma };
});

vi.mock("@/server/storage", async () => {
  const { storageDouble } = await import("../_helpers/review-api-test-doubles");
  return { createStorage: () => storageDouble };
});

const { GET } = await import("./route");

function readReview(
  init: Parameters<typeof reviewRequest>[1] = {},
  secret?: string,
) {
  return GET(
    reviewRequest(reviewUrl("", secret), init),
    reviewRouteParams({}, secret),
  );
}

type ReviewBody = {
  video: { posterUrl: string | null };
  feedback: { id: string }[];
  reviewer: { id: string; name: string } | null;
};

async function bodyOf(response: Response) {
  return (await response.json()) as ReviewBody;
}

const videoBlock = {
  id: VIDEO_ID,
  title: VIDEO_TITLE,
  durationMs: 83_000,
  width: 1920,
  height: 1080,
  annotationsOpen: true,
  playbackUrl: signedUrl(VIDEO_FILE_KEY),
  posterUrl: signedUrl(VIDEO_POSTER_KEY),
};

const linkNotFound = {
  error: "This link no longer works.",
  code: "link_not_found",
};

describe("GET /api/v1/review/:secret", () => {
  beforeEach(() => {
    resetReviewApiDoubles();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns the Video with a playback URL signed for one hour", async () => {
    const response = await readReview();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      video: videoBlock,
      feedback: [],
      reviewer: { id: REVIEWER_ID, name: REVIEWER_NAME },
    });
  });

  it("answers a null poster URL when the Video has no Poster", async () => {
    reviewApiTables.videos = [videoRow({ posterAsset: null })];

    const response = await readReview();

    const body = await bodyOf(response);
    expect(body.video.posterUrl).toBeNull();
  });

  it("lists every Feedback with its video Selection, Reviewer and signed Screenshot", async () => {
    reviewApiTables.reviewers.push(otherReviewerRow());
    reviewApiTables.feedbacks = [
      feedbackRow({
        screenshotId: "asset_1",
        screenshot: { key: SCREENSHOT_KEY },
      }),
      feedbackRow({
        id: "feedback_2",
        reviewerId: OTHER_REVIEWER_ID,
        reviewer: { id: OTHER_REVIEWER_ID, name: OTHER_REVIEWER_NAME },
        status: "resolved",
        comment: "Transition too slow",
        startMs: 10_000,
        endMs: 12_500,
        frameX: 0.1,
        frameY: 0.2,
        frameWidth: 0.3,
        frameHeight: 0.4,
      }),
      feedbackRow({
        id: "feedback_3",
        status: "closed",
        comment: "Music is too loud",
        startMs: 0,
        frameX: null,
        frameY: null,
      }),
    ];

    const response = await readReview();

    const body = await bodyOf(response);
    expect(body.feedback).toEqual([
      {
        id: FEEDBACK_ID,
        status: "new",
        comment: "The logo jumps here",
        pageUrl: null,
        clickX: null,
        clickY: null,
        selector: null,
        screenshotUrl: signedUrl(SCREENSHOT_KEY),
        metadata: null,
        reviewer: { id: REVIEWER_ID, name: REVIEWER_NAME },
        createdAt: CREATED_AT.toISOString(),
        startMs: 41_500,
        endMs: null,
        point: { x: 0.25, y: 0.5 },
        area: null,
      },
      {
        id: "feedback_2",
        status: "resolved",
        comment: "Transition too slow",
        pageUrl: null,
        clickX: null,
        clickY: null,
        selector: null,
        screenshotUrl: null,
        metadata: null,
        reviewer: { id: OTHER_REVIEWER_ID, name: OTHER_REVIEWER_NAME },
        createdAt: CREATED_AT.toISOString(),
        startMs: 10_000,
        endMs: 12_500,
        point: null,
        area: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
      },
      {
        id: "feedback_3",
        status: "closed",
        comment: "Music is too loud",
        pageUrl: null,
        clickX: null,
        clickY: null,
        selector: null,
        screenshotUrl: null,
        metadata: null,
        reviewer: { id: REVIEWER_ID, name: REVIEWER_NAME },
        createdAt: CREATED_AT.toISOString(),
        startMs: 0,
        endMs: null,
        point: null,
        area: null,
      },
    ]);
  });

  it("lists only the Feedback of this Video", async () => {
    reviewApiTables.feedbacks = [
      feedbackRow(),
      feedbackRow({ id: "feedback_page", videoId: null }),
      feedbackRow({ id: "feedback_other_video", videoId: "video_2" }),
    ];

    const response = await readReview();

    const body = await bodyOf(response);
    expect(body.feedback.map((item) => item.id)).toEqual([FEEDBACK_ID]);
  });

  it("answers 404 link_not_found for an unknown secret", async () => {
    const response = await readReview({}, "not_a_known_secret");

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual(linkNotFound);
  });

  it("answers 404 link_not_found once the link was replaced", async () => {
    reviewApiTables.videos = [videoRow({ shareTokenHash: "a_newer_hash" })];

    const response = await readReview();

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual(linkNotFound);
  });

  it("answers 404 link_not_found while the Video is still uploading", async () => {
    reviewApiTables.videos = [videoRow({ state: "uploading" })];

    const response = await readReview();

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual(linkNotFound);
  });

  it("names the caller's Reviewer when the header matches one of this Video", async () => {
    reviewApiTables.reviewers.push(otherReviewerRow());

    const response = await readReview({
      reviewerSecret: OTHER_REVIEWER_SECRET,
    });

    const body = await bodyOf(response);
    expect(body.reviewer).toEqual({
      id: OTHER_REVIEWER_ID,
      name: OTHER_REVIEWER_NAME,
    });
  });

  it("answers a null Reviewer without the header", async () => {
    const response = await readReview({ reviewerSecret: null });

    expect(response.status).toBe(200);
    const body = await bodyOf(response);
    expect(body.reviewer).toBeNull();
  });

  it("answers a null Reviewer for an unknown secret in the header", async () => {
    const response = await readReview({ reviewerSecret: "unknown_secret" });

    expect(response.status).toBe(200);
    const body = await bodyOf(response);
    expect(body.reviewer).toBeNull();
  });

  it("answers a null Reviewer for a Reviewer of another Video", async () => {
    reviewApiTables.reviewers = [otherReviewerRow({ videoId: "video_2" })];

    const response = await readReview({
      reviewerSecret: OTHER_REVIEWER_SECRET,
    });

    const body = await bodyOf(response);
    expect(body.reviewer).toBeNull();
  });

  it("answers 429 with the retry headers once the read limit is spent", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    blockRateLimit();

    const response = await readReview();

    expect(response.status).toBe(429);
    expect(Object.fromEntries(response.headers)).toMatchObject({
      "retry-after": "1800",
      "x-ratelimit-limit": "1000",
      "x-ratelimit-remaining": "0",
      "x-ratelimit-reset": String(
        Math.floor(new Date("2026-01-01T00:30:00.000Z").getTime() / 1000),
      ),
    });
    await expect(response.json()).resolves.toEqual({
      error: "Rate limit exceeded. Retry after 1800 seconds.",
      code: "rate_limited",
    });
  });
});
