/**
 * Contract tests for the agent Videos listing: they assert on the responses an
 * Agent-token caller observes, never on how the handler reaches them.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  agentApiPrisma,
  agentRequest,
  agentTokenRow,
  blockRateLimit,
  PROJECT_ID,
  PROJECT_PUBLIC_ID,
  resetAgentApiDoubles,
  VIDEO_ID,
  videoRow,
} from "../_helpers/agent-api-test-doubles";

vi.mock("@workspace/db", async () => {
  const { agentApiPrisma } = await import("../_helpers/agent-api-test-doubles");
  return { prisma: agentApiPrisma };
});

const { GET } = await import("./route");

const LIST_URL = `https://app.test/api/v1/agent/videos?project=${PROJECT_PUBLIC_ID}`;

type StoredVideo = typeof videoRow & { openFeedbackCount: number };

const newerVideo: StoredVideo = {
  ...videoRow,
  id: "5b1e7c3a-2f4d-4e8a-9b6c-0d1e2f3a4b5c",
  title: "Pricing page v2",
  filename: "pricing.mov",
  durationMs: 31000,
  width: 1280,
  height: 720,
  annotationsOpen: false,
  createdAt: new Date("2026-11-05T08:00:00.000Z"),
  openFeedbackCount: 0,
};

const uploadingVideo: StoredVideo = {
  ...videoRow,
  id: "9c8b7a6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d",
  title: "Still uploading",
  state: "uploading",
  createdAt: new Date("2026-11-05T09:00:00.000Z"),
  openFeedbackCount: 0,
};

/** Narrows, orders and projects the stored rows the way the query does. */
function seedVideos(rows: StoredVideo[]) {
  agentApiPrisma.video.findMany.mockImplementation(
    async ({ where }: { where: { projectId: string; state: string } }) =>
      rows
        .filter(
          (row) =>
            row.projectId === where.projectId && row.state === where.state,
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map(({ openFeedbackCount, ...row }) => ({
          ...row,
          _count: { feedback: openFeedbackCount },
        })),
  );
}

beforeEach(() => {
  resetAgentApiDoubles();
  vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "true");
  seedVideos([
    { ...videoRow, openFeedbackCount: 2 },
    newerVideo,
    uploadingVideo,
  ]);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("GET /api/v1/agent/videos", () => {
  it("lists the Project's ready Videos newest first, without uploads in flight", async () => {
    const response = await GET(agentRequest(LIST_URL));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      videos: [
        {
          id: newerVideo.id,
          title: "Pricing page v2",
          filename: "pricing.mov",
          durationMs: 31000,
          width: 1280,
          height: 720,
          annotationsOpen: false,
          openFeedbackCount: 0,
          createdAt: "2026-11-05T08:00:00.000Z",
        },
        {
          id: VIDEO_ID,
          title: "Homepage walkthrough v1",
          filename: "homepage-walkthrough.mp4",
          durationMs: 94200,
          width: 1920,
          height: 1080,
          annotationsOpen: true,
          openFeedbackCount: 2,
          createdAt: "2026-11-04T09:00:00.000Z",
        },
      ],
      count: 2,
    });
  });

  it("resolves the Project by its internal id", async () => {
    const response = await GET(
      agentRequest(
        `https://app.test/api/v1/agent/videos?project=${PROJECT_ID}`,
      ),
    );

    await expect(response.json()).resolves.toMatchObject({ count: 2 });
  });

  it("answers an empty list for a Project without a ready Video", async () => {
    seedVideos([uploadingVideo]);

    const response = await GET(agentRequest(LIST_URL));

    await expect(response.json()).resolves.toEqual({ videos: [], count: 0 });
  });

  it("refuses a request without an agent token", async () => {
    const response = await GET(agentRequest(LIST_URL, { token: null }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    });
  });

  it("refuses a token that lacks the read scope", async () => {
    agentApiPrisma.agentToken.findFirst.mockResolvedValue(
      agentTokenRow(["feedbacks:create", "feedbacks:update_status"]),
    );

    const response = await GET(agentRequest(LIST_URL));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Insufficient permissions",
      code: "FORBIDDEN",
    });
  });

  it("answers a rate limited caller with its retry headers and counters", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    blockRateLimit();

    const response = await GET(agentRequest(LIST_URL));

    expect(response.status).toBe(429);
    expect(Object.fromEntries(response.headers)).toMatchObject({
      "retry-after": "1800",
      "x-ratelimit-limit": "1000",
      "x-ratelimit-remaining": "0",
      "x-ratelimit-reset": String(
        Math.floor(new Date("2026-01-01T00:30:00.000Z").getTime() / 1000),
      ),
    });
    await expect(response.json()).resolves.toMatchObject({
      code: "RATE_LIMITED",
      limit: 1000,
      remaining: 0,
      retryAfterSeconds: 1800,
    });
  });

  it("rejects a query without a project", async () => {
    const response = await GET(
      agentRequest("https://app.test/api/v1/agent/videos"),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
    });
  });

  it("reports a project outside the token's organization as not found", async () => {
    const response = await GET(
      agentRequest(
        "https://app.test/api/v1/agent/videos?project=someone-elses",
      ),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Project not found",
      code: "NOT_FOUND",
    });
    expect(agentApiPrisma.video.findMany).not.toHaveBeenCalled();
  });
});
