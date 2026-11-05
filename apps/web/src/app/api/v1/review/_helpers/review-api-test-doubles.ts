/**
 * Shared doubles for the review API route tests, modelled on the widget ones.
 * The read, Reviewer claim, Feedback create and Feedback edit and delete route
 * tests drive the same database, storage and Inngest fakes through the same
 * defaults.
 *
 * Only the database client and the external modules (storage, Inngest) are
 * faked. The database fake keeps its rows in `reviewApiTables` and answers
 * `findFirst` and `findMany` by matching the scalar fields of `where` and
 * picking the fields of `select`, so the
 * Share link and Reviewer secret hashing run for real: a request carrying the
 * wrong secret finds nothing, as it would against Postgres.
 *
 * Test-only module: nothing under `src/` imports it at runtime.
 */

import crypto from "crypto";
import { NextRequest } from "next/server";
import { vi } from "vitest";

export const ORGANIZATION_ID = "organization_1";
export const PROJECT_ID = "project_1";
export const VIDEO_ID = "video_1";
export const VIDEO_TITLE = "Spring campaign, cut 2";
export const SHARE_LINK_SECRET = "share_link_secret_characterization";
export const REVIEWER_ID = "reviewer_1";
export const REVIEWER_NAME = "Surprising Cat";
export const REVIEWER_SECRET = "reviewer_secret_characterization";
export const OTHER_REVIEWER_ID = "reviewer_2";
export const OTHER_REVIEWER_NAME = "Patient Heron";
export const OTHER_REVIEWER_SECRET = "other_reviewer_secret_characterization";
export const FEEDBACK_ID = "feedback_1";
export const STORAGE_BUCKET = "review-assets";
export const VIDEO_FILE_KEY = `videos/${PROJECT_ID}/${VIDEO_ID}/source.mp4`;
export const VIDEO_POSTER_KEY = `videos/${PROJECT_ID}/${VIDEO_ID}/poster.jpg`;
export const SCREENSHOT_KEY = `feedback-screenshots/${PROJECT_ID}/shot.jpg`;
export const CREATED_AT = new Date("2026-01-02T03:04:05.000Z");

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export const SHARE_LINK_SECRET_HASH = sha256(SHARE_LINK_SECRET);
export const REVIEWER_SECRET_HASH = sha256(REVIEWER_SECRET);
export const OTHER_REVIEWER_SECRET_HASH = sha256(OTHER_REVIEWER_SECRET);

/** The URL the storage double signs for a key, carrying the expiry asked for. */
export function signedUrl(key: string, expiresIn = 3600) {
  return `https://storage.example.test/${key}?expiresIn=${expiresIn}`;
}

type Row = Record<string, unknown>;

/** A `ready` Video holding the known Share link, as the database stores it. */
export function videoRow(overrides: Row = {}): Row {
  return {
    id: VIDEO_ID,
    projectId: PROJECT_ID,
    title: VIDEO_TITLE,
    state: "ready",
    durationMs: 83_000,
    width: 1920,
    height: 1080,
    annotationsOpen: true,
    shareTokenHash: SHARE_LINK_SECRET_HASH,
    fileAsset: { key: VIDEO_FILE_KEY },
    posterAsset: { key: VIDEO_POSTER_KEY },
    project: { organizationId: ORGANIZATION_ID },
    ...overrides,
  };
}

/** The Reviewer the known Reviewer secret belongs to, on the Video. */
export function reviewerRow(overrides: Row = {}): Row {
  return {
    id: REVIEWER_ID,
    projectId: PROJECT_ID,
    videoId: VIDEO_ID,
    name: REVIEWER_NAME,
    token: REVIEWER_SECRET_HASH,
    isActive: true,
    ...overrides,
  };
}

export function otherReviewerRow(overrides: Row = {}): Row {
  return reviewerRow({
    id: OTHER_REVIEWER_ID,
    name: OTHER_REVIEWER_NAME,
    token: OTHER_REVIEWER_SECRET_HASH,
    ...overrides,
  });
}

/** A video Feedback with a point at an instant and no Screenshot. */
export function feedbackRow(overrides: Row = {}): Row {
  return {
    id: FEEDBACK_ID,
    projectId: PROJECT_ID,
    videoId: VIDEO_ID,
    reviewerId: REVIEWER_ID,
    status: "new",
    comment: "The logo jumps here",
    pageUrl: null,
    clickX: null,
    clickY: null,
    selector: null,
    metadata: null,
    createdAt: CREATED_AT,
    startMs: 83_000 / 2,
    endMs: null,
    frameX: 0.25,
    frameY: 0.5,
    frameWidth: null,
    frameHeight: null,
    screenshotId: null,
    screenshot: null,
    reviewer: { id: REVIEWER_ID, name: REVIEWER_NAME },
    ...overrides,
  };
}

/** The rows the database fake answers from. Reset before every test. */
export const reviewApiTables: {
  videos: Row[];
  reviewers: Row[];
  feedbacks: Row[];
  assets: Row[];
} = { videos: [], reviewers: [], feedbacks: [], assets: [] };

// Scalar conditions only: a nested filter (`{ not: null }`, a relation) is not
// interpreted and always matches, which is enough for the review routes.
function matchesWhere(row: Row, where: Row = {}) {
  return Object.entries(where).every(([field, condition]) =>
    condition !== null && typeof condition === "object"
      ? true
      : row[field] === condition,
  );
}

// A selected relation is returned as the row stores it, not re-selected.
function applySelect(row: Row, select?: Row) {
  if (!select) return row;
  return Object.fromEntries(
    Object.keys(select).map((field) => [field, row[field]]),
  );
}

type FindArgs = { where?: Row; select?: Row };

function findFirstIn(table: () => Row[]) {
  return vi.fn(async ({ where, select }: FindArgs = {}) => {
    const row = table().find((candidate) => matchesWhere(candidate, where));
    return row ? applySelect(row, select) : null;
  });
}

function findManyIn(table: () => Row[]) {
  return vi.fn(async ({ where, select }: FindArgs = {}) =>
    table()
      .filter((row) => matchesWhere(row, where))
      .map((row) => applySelect(row, select)),
  );
}

type CreateArgs = { data: Row; select?: Row };

// Inserts the row with the next sequential id, as Postgres would generate one.
function createIn(table: () => Row[], idPrefix: string) {
  return vi.fn(async ({ data, select }: CreateArgs) => {
    const row = { id: `${idPrefix}_${table().length + 1}`, ...data };
    table().push(row);
    return applySelect(row, select);
  });
}

// Fills the defaults Postgres would and resolves the `reviewer` and
// `screenshot` relations from their tables, so a `select` reads them back.
const createFeedback = vi.fn(async ({ data, select }: CreateArgs) => {
  const reviewer = reviewApiTables.reviewers.find(
    (row) => row.id === data.reviewerId,
  );
  const screenshot = reviewApiTables.assets.find(
    (row) => row.id === data.screenshotId,
  );
  const row: Row = {
    id: `feedback_${reviewApiTables.feedbacks.length + 1}`,
    status: "new",
    clickX: null,
    clickY: null,
    selector: null,
    metadata: null,
    createdAt: CREATED_AT,
    ...data,
    reviewer: reviewer ? { id: reviewer.id, name: reviewer.name } : null,
    screenshot: screenshot ? { key: screenshot.key } : null,
  };
  reviewApiTables.feedbacks.push(row);
  return applySelect(row, select);
});

export const reviewApiPrisma = {
  video: { findFirst: findFirstIn(() => reviewApiTables.videos) },
  reviewer: {
    findFirst: findFirstIn(() => reviewApiTables.reviewers),
    create: createIn(() => reviewApiTables.reviewers, "reviewer"),
  },
  feedback: {
    findFirst: findFirstIn(() => reviewApiTables.feedbacks),
    findMany: findManyIn(() => reviewApiTables.feedbacks),
    count: vi.fn(),
    create: createFeedback,
    update: vi.fn(),
    delete: vi.fn(),
  },
  asset: {
    findUnique: vi.fn(),
    create: createIn(() => reviewApiTables.assets, "asset"),
    delete: vi.fn(),
  },
  subscription: { findFirst: vi.fn() },
  $queryRaw: vi.fn(),
  $transaction: vi.fn(),
};

/** The storage backend `createStorage` hands out, for every provider. */
export const storageDouble = {
  put: vi.fn(),
  copy: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
  head: vi.fn(),
  getSignedUrl: vi.fn(),
};

export const inngestSendDouble = vi.fn();

/**
 * Defaults that let a well-formed request reach its handler body: a `ready`
 * Video behind the known Share link with annotations open, its Reviewer, no
 * Feedback yet, a rate limit window with room left and a free Plan well under
 * its Feedback ceiling. Each test narrows from there.
 */
export function resetReviewApiDoubles() {
  vi.clearAllMocks();
  vi.stubEnv("STORAGE_BUCKET_NAME", STORAGE_BUCKET);

  reviewApiTables.videos = [videoRow()];
  reviewApiTables.reviewers = [reviewerRow()];
  reviewApiTables.feedbacks = [];
  reviewApiTables.assets = [];

  reviewApiPrisma.subscription.findFirst.mockResolvedValue(null);
  reviewApiPrisma.feedback.count.mockResolvedValue(0);
  allowRateLimit();

  storageDouble.getSignedUrl.mockImplementation(
    async ({ key }: { key: string }, expiresIn: number) =>
      signedUrl(key, expiresIn),
  );
  storageDouble.put.mockResolvedValue(undefined);
  storageDouble.delete.mockResolvedValue(undefined);
  inngestSendDouble.mockResolvedValue(undefined);

  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
}

/** The rate limit counter, as `checkRateLimit`'s raw upsert returns it. */
function rateLimitRow(count: number, windowStartOffsetMs: number) {
  return [{ count, lastRequest: BigInt(Date.now() - windowStartOffsetMs) }];
}

export function allowRateLimit() {
  reviewApiPrisma.$queryRaw.mockResolvedValue(rateLimitRow(1, 0));
}

/** Pushes the counter past any review ceiling, 30 minutes into the window. */
export function blockRateLimit() {
  reviewApiPrisma.$queryRaw.mockResolvedValue(rateLimitRow(100_000, 1_800_000));
}

/** `https://app.test/api/v1/review/{secret}{suffix}`, e.g. `/feedbacks`. */
export function reviewUrl(suffix = "", secret = SHARE_LINK_SECRET) {
  return `https://app.test/api/v1/review/${secret}${suffix}`;
}

/** The second argument of a review route handler. */
export function reviewRouteParams<Extra extends Record<string, string>>(
  extra: Extra = {} as Extra,
  secret = SHARE_LINK_SECRET,
) {
  return { params: Promise.resolve({ secret, ...extra }) };
}

type ReviewRequestInit = {
  method?: string;
  /** Omitted → the known Reviewer secret. `null` → no `x-reviewer-token`. */
  reviewerSecret?: string | null;
  body?: BodyInit;
  /** Merged last, so a test can override or add a header. */
  headers?: Record<string, string>;
};

export function reviewRequest(url: string, init: ReviewRequestInit = {}) {
  const {
    method = "GET",
    reviewerSecret = REVIEWER_SECRET,
    body,
    headers: extraHeaders,
  } = init;

  const headers = new Headers();
  if (reviewerSecret) headers.set("x-reviewer-token", reviewerSecret);
  for (const [name, value] of Object.entries(extraHeaders ?? {})) {
    headers.set(name, value);
  }

  return new NextRequest(url, { method, headers, body });
}

/** The multipart body of a Feedback create: `data` as JSON, an optional file. */
export function feedbackFormData(
  data: unknown,
  screenshot?: File | string,
): FormData {
  const formData = new FormData();
  formData.set("data", typeof data === "string" ? data : JSON.stringify(data));
  if (screenshot !== undefined) formData.set("screenshot", screenshot);
  return formData;
}

export function screenshotFile(type = "image/jpeg", bytes = 8) {
  return new File([new Uint8Array(bytes)], "frame.jpg", { type });
}
