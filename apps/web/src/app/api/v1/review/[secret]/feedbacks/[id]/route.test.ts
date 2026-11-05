/**
 * Contract tests for `PATCH` and `DELETE /api/v1/review/:secret/feedbacks/:id`,
 * a Reviewer editing or withdrawing their own new Feedback. They assert on
 * responses and on the rows and stored objects the doubles hold afterwards.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  blockRateLimit,
  CREATED_AT,
  FEEDBACK_ID,
  feedbackRow,
  OTHER_REVIEWER_ID,
  OTHER_REVIEWER_NAME,
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
  STORAGE_BUCKET,
  storageDouble,
  videoRow,
} from "../../../_helpers/review-api-test-doubles";

vi.mock("@workspace/db", async () => {
  const { reviewApiPrisma } =
    await import("../../../_helpers/review-api-test-doubles");
  return { prisma: reviewApiPrisma };
});

vi.mock("@/server/storage", async () => {
  const { storageDouble } =
    await import("../../../_helpers/review-api-test-doubles");
  return { createStorage: () => storageDouble };
});

const { PATCH, DELETE } = await import("./route");

const SCREENSHOT_ASSET_ID = "asset_screenshot";
const OTHER_VIDEO_ID = "video_2";

type Init = { reviewerSecret?: string | null };

function patchFeedback(body: unknown, init: Init = {}, id = FEEDBACK_ID) {
  return PATCH(
    reviewRequest(reviewUrl(`/feedbacks/${id}`), {
      method: "PATCH",
      body: typeof body === "string" ? body : JSON.stringify(body),
      headers: { "content-type": "application/json" },
      ...init,
    }),
    reviewRouteParams({ id }),
  );
}

function deleteFeedback(init: Init = {}, id = FEEDBACK_ID) {
  return DELETE(
    reviewRequest(reviewUrl(`/feedbacks/${id}`), { method: "DELETE", ...init }),
    reviewRouteParams({ id }),
  );
}

async function expectError(
  response: Response,
  status: number,
  code: string,
  error: string,
) {
  expect(response.status).toBe(status);
  await expect(response.json()).resolves.toEqual({ error, code });
}

function expectNotFound(response: Response) {
  return expectError(
    response,
    404,
    "feedback_not_found",
    "This Feedback was not found.",
  );
}

/** The cases both verbs refuse the same way, so the Feedback is untouched. */
const refusals: {
  name: string;
  arrange?: () => void;
  init?: Init;
  expect: (response: Response) => Promise<void>;
}[] = [
  {
    name: "answers 404 for another Reviewer's Feedback",
    arrange: () => {
      reviewApiTables.reviewers.push(otherReviewerRow());
      reviewApiTables.feedbacks = [
        feedbackRow({
          reviewerId: OTHER_REVIEWER_ID,
          reviewer: { id: OTHER_REVIEWER_ID, name: OTHER_REVIEWER_NAME },
        }),
      ];
    },
    expect: expectNotFound,
  },
  {
    name: "answers 404 for own Feedback already in_progress",
    arrange: () => {
      reviewApiTables.feedbacks = [feedbackRow({ status: "in_progress" })];
    },
    expect: expectNotFound,
  },
  {
    name: "answers 404 for a Feedback of another Video",
    arrange: () => {
      reviewApiTables.feedbacks = [feedbackRow({ videoId: OTHER_VIDEO_ID })];
    },
    expect: expectNotFound,
  },
  {
    name: "answers 404 for an unknown Feedback id",
    arrange: () => {
      reviewApiTables.feedbacks = [feedbackRow({ id: "feedback_other" })];
    },
    expect: expectNotFound,
  },
  {
    name: "answers 403 annotations_closed when annotations are closed",
    arrange: () => {
      reviewApiTables.videos = [videoRow({ annotationsOpen: false })];
    },
    expect: (response) =>
      expectError(
        response,
        403,
        "annotations_closed",
        "Annotations are closed on this video.",
      ),
  },
  {
    name: "answers 401 reviewer_required without a Reviewer header",
    init: { reviewerSecret: null },
    expect: (response) =>
      expectError(
        response,
        401,
        "reviewer_required",
        "Pick a name before commenting on this video.",
      ),
  },
  {
    name: "answers 404 link_not_found for a replaced link",
    arrange: () => {
      reviewApiTables.videos = [videoRow({ shareTokenHash: "replaced" })];
    },
    expect: (response) =>
      expectError(
        response,
        404,
        "link_not_found",
        "This link no longer works.",
      ),
  },
  {
    name: "answers 429 with the retry headers once the submit limit is spent",
    arrange: blockRateLimit,
    expect: async (response) => {
      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBe("1800");
      await expect(response.json()).resolves.toMatchObject({
        code: "rate_limited",
      });
    },
  },
];

describe("PATCH /api/v1/review/:secret/feedbacks/:id", () => {
  beforeEach(() => {
    resetReviewApiDoubles();
    reviewApiTables.feedbacks = [feedbackRow()];
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("rewrites the comment of own new Feedback and answers the list item", async () => {
    const response = await patchFeedback({ comment: "  The logo jumps  " });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: FEEDBACK_ID,
      status: "new",
      comment: "The logo jumps",
      pageUrl: null,
      clickX: null,
      clickY: null,
      selector: null,
      screenshotUrl: null,
      metadata: null,
      reviewer: { id: REVIEWER_ID, name: REVIEWER_NAME },
      createdAt: CREATED_AT.toISOString(),
      startMs: 41_500,
      endMs: null,
      point: { x: 0.25, y: 0.5 },
      area: null,
    });
    expect(reviewApiTables.feedbacks[0]).toMatchObject({
      comment: "The logo jumps",
    });
  });

  it("answers the Screenshot URL signed for one hour", async () => {
    reviewApiTables.feedbacks = [
      feedbackRow({
        screenshotId: SCREENSHOT_ASSET_ID,
        screenshot: { key: SCREENSHOT_KEY },
      }),
    ];

    const response = await patchFeedback({ comment: "Sharper note" });

    await expect(response.json()).resolves.toMatchObject({
      screenshotUrl: signedUrl(SCREENSHOT_KEY, 3600),
    });
  });

  it("refuses an empty comment", async () => {
    const response = await patchFeedback({ comment: "   " });

    await expectError(
      response,
      400,
      "invalid_request",
      "Write a comment before posting.",
    );
    expect(reviewApiTables.feedbacks[0]).toMatchObject({
      comment: "The logo jumps here",
    });
  });

  it("refuses a comment above 5000 characters", async () => {
    const response = await patchFeedback({ comment: "a".repeat(5001) });

    await expectError(
      response,
      400,
      "invalid_request",
      "A comment cannot exceed 5000 characters.",
    );
  });

  it("refuses a body that is not JSON", async () => {
    const response = await patchFeedback("not json");

    expect(response.status).toBe(400);
  });

  it.each(refusals)("$name", async ({ arrange, init, expect: check }) => {
    arrange?.();
    const before = structuredClone(reviewApiTables.feedbacks);

    await check(await patchFeedback({ comment: "Edited" }, init));

    expect(reviewApiTables.feedbacks).toEqual(before);
  });
});

describe("DELETE /api/v1/review/:secret/feedbacks/:id", () => {
  beforeEach(() => {
    resetReviewApiDoubles();
    reviewApiTables.feedbacks = [feedbackRow()];
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("deletes own new Feedback and answers 204", async () => {
    const response = await deleteFeedback();

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(reviewApiTables.feedbacks).toEqual([]);
    expect(storageDouble.delete).not.toHaveBeenCalled();
  });

  it("frees the Screenshot through the single-asset delete", async () => {
    reviewApiTables.assets = [
      { id: SCREENSHOT_ASSET_ID, key: SCREENSHOT_KEY },
      { id: "asset_other", key: "feedback-screenshots/other.jpg" },
    ];
    reviewApiTables.feedbacks = [
      feedbackRow({
        screenshotId: SCREENSHOT_ASSET_ID,
        screenshot: { key: SCREENSHOT_KEY },
      }),
    ];

    const response = await deleteFeedback();

    expect(response.status).toBe(204);
    expect(storageDouble.delete).toHaveBeenCalledWith({
      bucket: STORAGE_BUCKET,
      key: SCREENSHOT_KEY,
    });
    expect(reviewApiTables.assets).toEqual([
      { id: "asset_other", key: "feedback-screenshots/other.jpg" },
    ]);
  });

  it("leaves the other Feedback of the Reviewer in place", async () => {
    reviewApiTables.feedbacks.push(feedbackRow({ id: "feedback_2" }));

    await deleteFeedback();

    expect(reviewApiTables.feedbacks.map((row) => row.id)).toEqual([
      "feedback_2",
    ]);
  });

  it.each(refusals)("$name", async ({ arrange, init, expect: check }) => {
    arrange?.();
    const before = structuredClone(reviewApiTables.feedbacks);

    await check(await deleteFeedback(init));

    expect(reviewApiTables.feedbacks).toEqual(before);
  });
});
