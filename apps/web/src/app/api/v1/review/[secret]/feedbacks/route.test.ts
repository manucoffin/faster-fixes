/**
 * Contract tests for `POST /api/v1/review/:secret/feedbacks`, a Reviewer
 * posting a Feedback on the Video. They assert on responses and on the rows,
 * stored objects and events the doubles hold afterwards, never on how the
 * handler reaches them.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  blockRateLimit,
  CREATED_AT,
  feedbackFormData,
  inngestSendDouble,
  PROJECT_ID,
  resetReviewApiDoubles,
  REVIEWER_ID,
  REVIEWER_NAME,
  reviewApiPrisma,
  reviewApiTables,
  reviewRequest,
  reviewRouteParams,
  reviewUrl,
  screenshotFile,
  signedUrl,
  STORAGE_BUCKET,
  storageDouble,
  VIDEO_ID,
  videoRow,
} from "../../_helpers/review-api-test-doubles";

vi.mock("@workspace/db", async () => {
  const { reviewApiPrisma } =
    await import("../../_helpers/review-api-test-doubles");
  return { prisma: reviewApiPrisma };
});

vi.mock("@/server/storage", async () => {
  const { storageDouble } =
    await import("../../_helpers/review-api-test-doubles");
  return { createStorage: () => storageDouble };
});

vi.mock("@/server/inngest", async () => {
  const { inngestSendDouble } =
    await import("../../_helpers/review-api-test-doubles");
  return { inngest: { send: inngestSendDouble } };
});

const { POST } = await import("./route");

const pointPayload = {
  comment: "The logo jumps here",
  startMs: 12_000,
  endMs: null,
  point: { x: 0.25, y: 0.5 },
  browserName: "Firefox",
  browserVersion: "142.0",
  os: "macOS",
  viewportWidth: 1440,
  viewportHeight: 900,
};

function postFeedback(
  body: FormData | string,
  init: { reviewerSecret?: string | null } = {},
) {
  return POST(
    reviewRequest(reviewUrl("/feedbacks"), { method: "POST", body, ...init }),
    reviewRouteParams(),
  );
}

async function expectInvalid(response: Response, message: string) {
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: message,
    code: "invalid_request",
  });
  expect(reviewApiTables.feedbacks).toHaveLength(0);
}

describe("POST /api/v1/review/:secret/feedbacks", () => {
  beforeEach(() => {
    resetReviewApiDoubles();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("stores a point Feedback in the flat columns with no page URL and emits the created event", async () => {
    const response = await postFeedback(feedbackFormData(pointPayload));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      id: "feedback_1",
      status: "new",
      comment: "The logo jumps here",
      pageUrl: null,
      clickX: null,
      clickY: null,
      selector: null,
      screenshotUrl: null,
      metadata: null,
      reviewer: { id: REVIEWER_ID, name: REVIEWER_NAME },
      createdAt: CREATED_AT.toISOString(),
      startMs: 12_000,
      endMs: null,
      point: { x: 0.25, y: 0.5 },
      area: null,
    });
    expect(reviewApiTables.feedbacks[0]).toMatchObject({
      projectId: PROJECT_ID,
      videoId: VIDEO_ID,
      reviewerId: REVIEWER_ID,
      pageUrl: null,
      startMs: 12_000,
      endMs: null,
      frameX: 0.25,
      frameY: 0.5,
      frameWidth: null,
      frameHeight: null,
      browserName: "Firefox",
      browserVersion: "142.0",
      os: "macOS",
      viewportWidth: 1440,
      viewportHeight: 900,
    });
    expect(inngestSendDouble).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "feedback/created",
        data: { feedbackId: "feedback_1" },
      }),
    );
  });

  it("stores a range with an area", async () => {
    const response = await postFeedback(
      feedbackFormData({
        comment: "The transition is too slow",
        startMs: 20_000,
        endMs: 24_500,
        area: { x: 0.1, y: 0.2, width: 0.5, height: 0.4 },
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      startMs: 20_000,
      endMs: 24_500,
      point: null,
      area: { x: 0.1, y: 0.2, width: 0.5, height: 0.4 },
    });
    expect(reviewApiTables.feedbacks[0]).toMatchObject({
      endMs: 24_500,
      frameX: 0.1,
      frameY: 0.2,
      frameWidth: 0.5,
      frameHeight: 0.4,
    });
  });

  it("accepts a Feedback that marks neither a point nor an area", async () => {
    const response = await postFeedback(
      feedbackFormData({ comment: "Music too loud", startMs: 0, endMs: null }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      point: null,
      area: null,
    });
    expect(reviewApiTables.feedbacks[0]).toMatchObject({
      frameX: null,
      frameY: null,
      frameWidth: null,
      frameHeight: null,
    });
  });

  it("refuses an out point that is not later than the in point", async () => {
    await expectInvalid(
      await postFeedback(
        feedbackFormData({ ...pointPayload, endMs: pointPayload.startMs }),
      ),
      "The out point must be later than the in point.",
    );
  });

  it("refuses a coordinate outside 0..1", async () => {
    await expectInvalid(
      await postFeedback(
        feedbackFormData({ ...pointPayload, point: { x: 1.5, y: 0.5 } }),
      ),
      "Coordinates must be between 0 and 1.",
    );
  });

  it("refuses an area leaving the frame", async () => {
    await expectInvalid(
      await postFeedback(
        feedbackFormData({
          ...pointPayload,
          point: undefined,
          area: { x: 0.7, y: 0.2, width: 0.5, height: 0.4 },
        }),
      ),
      "An area must stay inside the frame.",
    );
  });

  it("refuses an in point beyond the Video's duration", async () => {
    await expectInvalid(
      await postFeedback(
        feedbackFormData({ ...pointPayload, startMs: 83_001 }),
      ),
      "The in point is past the end of the video.",
    );
  });

  it("refuses an empty comment", async () => {
    await expectInvalid(
      await postFeedback(feedbackFormData({ ...pointPayload, comment: "  " })),
      "Write a comment before posting.",
    );
  });

  it("refuses a data field that is not JSON", async () => {
    await expectInvalid(
      await postFeedback(feedbackFormData("{not json")),
      "The data field is not valid JSON.",
    );
  });

  it("refuses a form with no data field", async () => {
    await expectInvalid(
      await postFeedback(new FormData()),
      "The data field is missing.",
    );
  });

  it("stores the Screenshot part through the storage put and links its Asset", async () => {
    const response = await postFeedback(
      feedbackFormData(pointPayload, screenshotFile()),
    );

    expect(response.status).toBe(201);
    const [asset] = reviewApiTables.assets;
    expect(asset).toMatchObject({
      filename: "screenshot.jpeg",
      mimeType: "image/jpeg",
      size: BigInt(8),
      bucket: STORAGE_BUCKET,
    });
    expect(asset?.key).toMatch(
      new RegExp(`^feedback-screenshots/${PROJECT_ID}/.+\\.jpeg$`),
    );
    expect(storageDouble.put).toHaveBeenCalledWith(
      expect.objectContaining({
        bucket: STORAGE_BUCKET,
        key: asset?.key,
        contentType: "image/jpeg",
      }),
    );
    expect(reviewApiTables.feedbacks[0]).toMatchObject({
      screenshotId: asset?.id,
    });
    await expect(response.json()).resolves.toMatchObject({
      screenshotUrl: signedUrl(String(asset?.key)),
    });
  });

  it("posts the Feedback without a Screenshot when the storage put fails", async () => {
    storageDouble.put.mockRejectedValue(new Error("bucket unreachable"));

    const response = await postFeedback(
      feedbackFormData(pointPayload, screenshotFile()),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      screenshotUrl: null,
    });
    expect(reviewApiTables.feedbacks[0]?.screenshotId).toBeUndefined();
  });

  it("refuses a Screenshot that is not an allowed image type", async () => {
    await expectInvalid(
      await postFeedback(
        feedbackFormData(pointPayload, screenshotFile("application/pdf")),
      ),
      "Invalid screenshot type. Allowed: JPEG, PNG, WebP.",
    );
  });

  it("refuses a Screenshot above 5 MB", async () => {
    const response = await postFeedback(
      feedbackFormData(
        pointPayload,
        screenshotFile("image/jpeg", 5 * 1024 * 1024 + 1),
      ),
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      error: "The screenshot exceeds the 5 MB limit.",
      code: "screenshot_too_large",
    });
    expect(storageDouble.put).not.toHaveBeenCalled();
  });

  it("answers 401 reviewer_required without a Reviewer header", async () => {
    const response = await postFeedback(feedbackFormData(pointPayload), {
      reviewerSecret: null,
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Pick a name before commenting on this video.",
      code: "reviewer_required",
    });
  });

  it("answers 401 reviewer_required for a secret of no Reviewer on this Video", async () => {
    const response = await postFeedback(feedbackFormData(pointPayload), {
      reviewerSecret: "unknown_secret",
    });

    expect(response.status).toBe(401);
  });

  it("answers 403 annotations_closed when annotations are closed", async () => {
    reviewApiTables.videos = [videoRow({ annotationsOpen: false })];

    const response = await postFeedback(feedbackFormData(pointPayload));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Annotations are closed on this video.",
      code: "annotations_closed",
    });
    expect(reviewApiTables.feedbacks).toHaveLength(0);
  });

  it("answers the Widget's capacity error once the Plan's Feedback cap is reached", async () => {
    // Self-hosted instances have no Plan cap: billing is a Cloud concern.
    vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "true");
    reviewApiPrisma.feedback.count.mockResolvedValue(50);

    const response = await postFeedback(feedbackFormData(pointPayload));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Feedback limit reached for this organization's plan.",
      code: "RESOURCE_LIMIT_EXCEEDED",
      current: 50,
      limit: 50,
    });
    expect(reviewApiTables.feedbacks).toHaveLength(0);
  });

  it("answers 404 link_not_found for an unknown link", async () => {
    reviewApiTables.videos = [videoRow({ shareTokenHash: "replaced" })];

    const response = await postFeedback(feedbackFormData(pointPayload));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      code: "link_not_found",
    });
  });

  it("answers 429 with the retry headers once the submit limit is spent", async () => {
    blockRateLimit();

    const response = await postFeedback(feedbackFormData(pointPayload));

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({
      code: "rate_limited",
    });
    expect(response.headers.get("Retry-After")).not.toBeNull();
    expect(reviewApiTables.feedbacks).toHaveLength(0);
  });
});
