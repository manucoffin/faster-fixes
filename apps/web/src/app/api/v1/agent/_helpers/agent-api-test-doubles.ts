/**
 * Shared doubles for the agent API route tests. They live here, next to the
 * routes they serve, so the `feedbacks` and status route tests drive the same
 * database, storage and Inngest fakes through the same defaults.
 *
 * Test-only module: nothing under `src/` imports it at runtime.
 */

import crypto from "crypto";
import { NextRequest } from "next/server";
import { vi } from "vitest";

export const AGENT_TOKEN = "ff_agent_characterization";
export const AGENT_TOKEN_ID = "token_1";
export const ORGANIZATION_ID = "organization_1";
export const PROJECT_ID = "project_1";
export const PROJECT_PUBLIC_ID = "proj_public_1";
export const REVIEWER_ID = "reviewer_1";
export const SIGNED_ASSET_URL = "https://assets.example.test/signed";
export const VIDEO_ID = "d4f0a2c1-7e3b-4b7a-9a1e-2c5f8e9d1b23";

export const ALL_AGENT_SCOPES = [
  "feedbacks:read",
  "feedbacks:create",
  "feedbacks:update_status",
];

const TOKEN_HASH = crypto
  .createHash("sha256")
  .update(AGENT_TOKEN)
  .digest("hex");

export function agentTokenRow(scopes: string[] = ALL_AGENT_SCOPES) {
  return {
    id: AGENT_TOKEN_ID,
    tokenHash: TOKEN_HASH,
    scopes,
    isActive: true,
    revokedAt: null,
    organization: {
      id: ORGANIZATION_ID,
      projects: [{ id: PROJECT_ID, publicId: PROJECT_PUBLIC_ID }],
    },
  };
}

export const agentApiPrisma = {
  agentToken: { findFirst: vi.fn(), update: vi.fn() },
  subscription: { findFirst: vi.fn() },
  feedback: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  reviewer: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  video: { findFirst: vi.fn(), findMany: vi.fn() },
  $queryRaw: vi.fn(),
  $transaction: vi.fn(),
};

/** A `ready` Video of the token's Project, as the `video` table stores it. */
export const videoRow = {
  id: VIDEO_ID,
  projectId: PROJECT_ID,
  title: "Homepage walkthrough v1",
  filename: "homepage-walkthrough.mp4",
  state: "ready",
  durationMs: 94200,
  width: 1920,
  height: 1080,
  annotationsOpen: true,
  createdAt: new Date("2026-11-04T09:00:00.000Z"),
};

/** A Feedback on `videoRow`: an instant with a point, page fields empty. */
export const videoFeedbackRow = {
  id: "feedback_video_1",
  status: "new",
  comment: "The logo jumps when the menu opens",
  videoId: VIDEO_ID,
  pageUrl: null,
  startMs: 12340,
  endMs: null,
  frameX: 0.42,
  frameY: 0.61,
  frameWidth: null,
  frameHeight: null,
  selector: null,
  clickX: null,
  clickY: null,
  viewportWidth: null,
  viewportHeight: null,
  browserName: "Chrome",
  browserVersion: "142",
  os: "macOS",
  screenshot: { key: "frame.jpg", provider: "s3", bucket: "assets" },
  metadata: null,
  diagnosticTrail: null,
  customMetadata: null,
  reviewer: { name: "Curious Otter" },
  video: { title: videoRow.title },
  createdAt: new Date("2026-11-04T09:12:33.000Z"),
};

export const getSignedAssetUrlDouble = vi.fn();
export const inngestSendDouble = vi.fn();

/**
 * Defaults that let a well-formed request reach its handler body: a token with
 * every scope, a free plan with no subscription row, and a rate limit window
 * with room left. Each test narrows from there.
 */
export function resetAgentApiDoubles() {
  vi.clearAllMocks();

  agentApiPrisma.agentToken.findFirst.mockResolvedValue(agentTokenRow());
  // Fire-and-forget `lastUsedAt` write: the handler only calls `.catch` on it.
  agentApiPrisma.agentToken.update.mockResolvedValue(undefined);
  agentApiPrisma.subscription.findFirst.mockResolvedValue(null);
  agentApiPrisma.$transaction.mockImplementation(
    async (operations: Promise<unknown>[]) => Promise.all(operations),
  );
  allowRateLimit();

  getSignedAssetUrlDouble.mockResolvedValue(SIGNED_ASSET_URL);
  inngestSendDouble.mockResolvedValue(undefined);

  vi.spyOn(console, "info").mockImplementation(() => {});
}

/** The rate limit counter, as `checkRateLimit`'s raw upsert returns it. */
function rateLimitRow(count: number, windowStartOffsetMs: number) {
  return [
    {
      count,
      lastRequest: BigInt(Date.now() - windowStartOffsetMs),
    },
  ];
}

export function allowRateLimit() {
  agentApiPrisma.$queryRaw.mockResolvedValue(rateLimitRow(1, 0));
}

/** Pushes the counter past any plan ceiling, 30 minutes into the window. */
export function blockRateLimit() {
  agentApiPrisma.$queryRaw.mockResolvedValue(rateLimitRow(100_000, 1_800_000));
}

type AgentRequestInit = {
  method?: string;
  /** Omitted → no Authorization header at all. */
  token?: string | null;
  body?: unknown;
  /** Passed through untouched, so a test can send invalid JSON. */
  rawBody?: string;
};

export function agentRequest(url: string, init: AgentRequestInit = {}) {
  const { method = "GET", token = AGENT_TOKEN, body, rawBody } = init;
  const headers = new Headers();
  if (token) headers.set("authorization", `Bearer ${token}`);
  if (body !== undefined || rawBody !== undefined) {
    headers.set("content-type", "application/json");
  }

  return new NextRequest(url, {
    method,
    headers,
    body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
}
