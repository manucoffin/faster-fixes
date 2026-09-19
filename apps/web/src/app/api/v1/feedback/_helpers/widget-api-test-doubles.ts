/**
 * Shared doubles for the public widget API route tests. They live here, next to
 * the routes they serve, so the submit/list, edit/delete, screenshot and widget
 * config route tests drive the same database, storage and Inngest fakes through
 * the same defaults.
 *
 * Only the database client and the external modules (storage, Inngest) are
 * faked. The request helpers (Project resolution, Allowed origins matching,
 * Reviewer token validation, the rate limit counter, the Plan limit check) run
 * for real on top of the database fake, so relocating them leaves these tests
 * untouched.
 *
 * Test-only module: nothing under `src/` imports it at runtime.
 */

import { NextRequest } from "next/server";
import { vi } from "vitest";

export const ORGANIZATION_ID = "organization_1";
export const PROJECT_ID = "project_1";
export const PROJECT_PUBLIC_ID = "proj_public_1";
export const PROJECT_DOMAIN = "client.test";
export const ALLOWED_ORIGIN = "https://client.test";
export const REVIEWER_ID = "reviewer_1";
export const REVIEWER_NAME = "Dana";
export const REVIEWER_TOKEN = "reviewer_token_characterization";
export const FEEDBACK_ID = "feedback_1";
export const SIGNED_ASSET_URL = "https://assets.example.test/signed";
export const SCREENSHOT_ASSET_ID = "asset_1";
export const STORAGE_BUCKET = "feedback-assets";

export function projectRow(overrides: Record<string, unknown> = {}) {
  return {
    id: PROJECT_ID,
    publicId: PROJECT_PUBLIC_ID,
    organizationId: ORGANIZATION_ID,
    domain: PROJECT_DOMAIN,
    widgetConfig: null,
    ...overrides,
  };
}

export function reviewerRow() {
  return {
    id: REVIEWER_ID,
    projectId: PROJECT_ID,
    name: REVIEWER_NAME,
    isActive: true,
  };
}

/** A stored Feedback, as the edit and delete routes read it back. */
export function feedbackRow(overrides: Record<string, unknown> = {}) {
  return {
    id: FEEDBACK_ID,
    projectId: PROJECT_ID,
    reviewerId: REVIEWER_ID,
    comment: "The submit button does nothing",
    ...overrides,
  };
}

/** An active paid Subscription, as the Plan resolution reads it back. */
export function subscriptionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "subscription_1",
    referenceId: ORGANIZATION_ID,
    plan: "pro",
    status: "active",
    periodEnd: null,
    ...overrides,
  };
}

export const widgetApiPrisma = {
  project: { findFirst: vi.fn() },
  reviewer: { findFirst: vi.fn() },
  subscription: { findFirst: vi.fn() },
  feedback: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  $queryRaw: vi.fn(),
  $transaction: vi.fn(),
};

export const getSignedAssetUrlDouble = vi.fn();
export const inngestSendDouble = vi.fn();
export const putObjectDouble = vi.fn();
export const createAssetDouble = vi.fn();

/**
 * Defaults that let a well-formed request reach its handler body: a resolvable
 * Project, an active Reviewer, a rate limit window with room left, and a free
 * plan well under its Feedback ceiling. Each test narrows from there.
 */
export function resetWidgetApiDoubles() {
  vi.clearAllMocks();

  widgetApiPrisma.project.findFirst.mockResolvedValue(projectRow());
  widgetApiPrisma.reviewer.findFirst.mockResolvedValue(reviewerRow());
  widgetApiPrisma.subscription.findFirst.mockResolvedValue(null);
  widgetApiPrisma.feedback.count.mockResolvedValue(0);
  widgetApiPrisma.feedback.findFirst.mockResolvedValue(feedbackRow());
  widgetApiPrisma.feedback.findMany.mockResolvedValue([]);
  allowRateLimit();

  getSignedAssetUrlDouble.mockResolvedValue(SIGNED_ASSET_URL);
  inngestSendDouble.mockResolvedValue(undefined);
  putObjectDouble.mockResolvedValue(undefined);
  createAssetDouble.mockResolvedValue({ id: SCREENSHOT_ASSET_ID });

  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
}

/** The rate limit counter, as `checkRateLimit`'s raw upsert returns it. */
function rateLimitRow(count: number, windowStartOffsetMs: number) {
  return [{ count, lastRequest: BigInt(Date.now() - windowStartOffsetMs) }];
}

export function allowRateLimit() {
  widgetApiPrisma.$queryRaw.mockResolvedValue(rateLimitRow(1, 0));
}

/** Pushes the counter past any widget ceiling, 30 minutes into the window. */
export function blockRateLimit() {
  widgetApiPrisma.$queryRaw.mockResolvedValue(rateLimitRow(100_000, 1_800_000));
}

type WidgetRequestInit = {
  method?: string;
  /** Omitted → the Project public ID. `null` → no `x-api-key` header. */
  apiKey?: string | null;
  /** Omitted → the Project's registered domain. `null` → no `origin` header. */
  origin?: string | null;
  /** Omitted → the Reviewer token. `null` → no `x-reviewer-token` header. */
  reviewerToken?: string | null;
  body?: BodyInit;
  /** Merged last, so a test can override or add a header. */
  headers?: Record<string, string>;
};

export function widgetRequest(url: string, init: WidgetRequestInit = {}) {
  const {
    method = "GET",
    apiKey = PROJECT_PUBLIC_ID,
    origin = ALLOWED_ORIGIN,
    reviewerToken = REVIEWER_TOKEN,
    body,
    headers: extraHeaders,
  } = init;

  const headers = new Headers();
  if (apiKey) headers.set("x-api-key", apiKey);
  if (origin) headers.set("origin", origin);
  if (reviewerToken) headers.set("x-reviewer-token", reviewerToken);
  for (const [name, value] of Object.entries(extraHeaders ?? {})) {
    headers.set(name, value);
  }

  return new NextRequest(url, { method, headers, body });
}

type FeedbackFormInit = {
  /** Omitted → a valid payload. `null` → no `data` field at all. */
  data?: unknown;
  /** Passed through untouched, so a test can send invalid JSON. */
  rawData?: string;
  screenshot?: File;
  /** A non-file value under the `screenshot` field. */
  rawScreenshot?: string;
};

export const validFeedbackPayload = {
  comment: "The submit button does nothing",
  pageUrl: "https://client.test/checkout",
  selector: "#submit",
  clickX: 12,
  clickY: 34,
};

export function feedbackFormData(init: FeedbackFormInit = {}) {
  const {
    data = validFeedbackPayload,
    rawData,
    screenshot,
    rawScreenshot,
  } = init;
  const formData = new FormData();

  if (rawData !== undefined) {
    formData.set("data", rawData);
  } else if (data !== null) {
    formData.set("data", JSON.stringify(data));
  }

  if (screenshot) formData.set("screenshot", screenshot);
  if (rawScreenshot !== undefined) formData.set("screenshot", rawScreenshot);

  return formData;
}

export function screenshotFile(
  type = "image/png",
  bytes = 8,
  name = "shot.png",
) {
  return new File([new Uint8Array(bytes)], name, { type });
}
