/**
 * Contract tests for `POST /api/v1/review/:secret/reviewers`, the claim of a
 * Reviewer name on a Video. They assert on responses and on the rows the
 * database fake holds afterwards, never on how the handler reaches them.
 */

import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  blockRateLimit,
  PROJECT_ID,
  resetReviewApiDoubles,
  REVIEWER_ID,
  REVIEWER_NAME,
  REVIEWER_SECRET,
  reviewApiTables,
  reviewerRow,
  reviewRequest,
  reviewRouteParams,
  reviewUrl,
  VIDEO_ID,
  videoRow,
} from "../../_helpers/review-api-test-doubles";

vi.mock("@workspace/db", async () => {
  const { reviewApiPrisma } =
    await import("../../_helpers/review-api-test-doubles");
  return { prisma: reviewApiPrisma };
});

const { POST } = await import("./route");

const NEW_SECRET = "new_browser_secret_characterization";
const NEW_SECRET_HASH = createHash("sha256").update(NEW_SECRET).digest("hex");

function claimName(
  body: unknown,
  init: { reviewerSecret?: string | null; secret?: string } = {},
) {
  const { reviewerSecret = NEW_SECRET, secret } = init;
  return POST(
    reviewRequest(reviewUrl("/reviewers", secret), {
      method: "POST",
      reviewerSecret,
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    }),
    reviewRouteParams({}, secret),
  );
}

function reviewerNamed(name: string) {
  return reviewApiTables.reviewers.find((row) => row.name === name);
}

describe("POST /api/v1/review/:secret/reviewers", () => {
  beforeEach(() => {
    resetReviewApiDoubles();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("creates the Reviewer with the hashed secret and the Video's Project", async () => {
    const response = await claimName({ name: "Patient Heron" });

    expect(response.status).toBe(201);
    const created = reviewerNamed("Patient Heron");
    await expect(response.json()).resolves.toEqual({
      reviewer: { id: created?.id, name: "Patient Heron" },
    });
    expect(created).toMatchObject({
      projectId: PROJECT_ID,
      videoId: VIDEO_ID,
      name: "Patient Heron",
    });
    expect(created?.token).toBe(NEW_SECRET_HASH);
  });

  it("answers the existing Reviewer when the same secret claims its name again", async () => {
    const response = await claimName(
      { name: REVIEWER_NAME },
      { reviewerSecret: REVIEWER_SECRET },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reviewer: { id: REVIEWER_ID, name: REVIEWER_NAME },
    });
    expect(reviewApiTables.reviewers).toHaveLength(1);
  });

  it("answers 409 name_taken when another secret holds the name", async () => {
    const response = await claimName({ name: REVIEWER_NAME });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "This name is already in use on this video. Choose another one.",
      code: "name_taken",
    });
    expect(reviewApiTables.reviewers).toHaveLength(1);
  });

  it("lets the same name be claimed on another Video", async () => {
    reviewApiTables.reviewers = [reviewerRow({ videoId: "video_2" })];

    const response = await claimName({ name: REVIEWER_NAME });

    expect(response.status).toBe(201);
  });

  it("trims and collapses the whitespace of the name", async () => {
    const response = await claimName({ name: "  Patient \t  Heron  " });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      reviewer: { name: "Patient Heron" },
    });
  });

  it("treats a name differing only by whitespace as the taken name", async () => {
    const response = await claimName({
      name: ` ${REVIEWER_NAME.replace(" ", "   ")} `,
    });

    expect(response.status).toBe(409);
  });

  it("answers 400 to an empty name", async () => {
    const response = await claimName({ name: "   " });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Enter a name.",
      code: "invalid_request",
    });
    expect(reviewApiTables.reviewers).toHaveLength(1);
  });

  it("accepts a 50-character name", async () => {
    const response = await claimName({ name: "a".repeat(50) });

    expect(response.status).toBe(201);
  });

  it("answers 400 to a 51-character name", async () => {
    const response = await claimName({ name: "a".repeat(51) });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "The name must be 50 characters or fewer.",
      code: "invalid_request",
    });
  });

  it("answers 400 to a body that is not JSON", async () => {
    const response = await POST(
      reviewRequest(reviewUrl("/reviewers"), {
        method: "POST",
        reviewerSecret: NEW_SECRET,
        body: "not json",
      }),
      reviewRouteParams(),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "invalid_request",
    });
  });

  it("answers 401 reviewer_required without a secret to bind the name to", async () => {
    const response = await claimName(
      { name: "Patient Heron" },
      { reviewerSecret: null },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Pick a name before commenting on this video.",
      code: "reviewer_required",
    });
  });

  it("answers 403 annotations_closed when annotations are closed", async () => {
    reviewApiTables.videos = [videoRow({ annotationsOpen: false })];

    const response = await claimName({ name: "Patient Heron" });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Annotations are closed on this video.",
      code: "annotations_closed",
    });
    expect(reviewerNamed("Patient Heron")).toBeUndefined();
  });

  it("answers 404 link_not_found to an unknown Share link", async () => {
    const response = await claimName(
      { name: "Patient Heron" },
      { secret: "replaced_secret" },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "This link no longer works.",
      code: "link_not_found",
    });
  });

  it("counts the claim under the submit limit and answers 429 once it is spent", async () => {
    blockRateLimit();

    const response = await claimName({ name: "Patient Heron" });

    expect(response.status).toBe(429);
    expect(response.headers.get("x-ratelimit-limit")).toBe("500");
    await expect(response.json()).resolves.toMatchObject({
      code: "rate_limited",
    });
    expect(reviewerNamed("Patient Heron")).toBeUndefined();
  });
});
