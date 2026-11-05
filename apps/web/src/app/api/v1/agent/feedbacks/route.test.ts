/**
 * Characterization tests: they pin what an Agent-token caller observes today
 * (status, JSON body, headers) so the step 4 move to a service behind a route
 * boundary can be proven byte-compatible. They assert on responses only, never
 * on how the handler reaches them.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  agentApiPrisma,
  agentRequest,
  agentTokenRow,
  blockRateLimit,
  getSignedAssetUrlDouble,
  inngestSendDouble,
  PROJECT_ID,
  PROJECT_PUBLIC_ID,
  resetAgentApiDoubles,
  REVIEWER_ID,
  SIGNED_ASSET_URL,
  VIDEO_ID,
  videoFeedbackRow,
  videoRow,
} from "../_helpers/agent-api-test-doubles";

vi.mock("@workspace/db", async () => {
  const { agentApiPrisma } = await import("../_helpers/agent-api-test-doubles");
  return { prisma: agentApiPrisma };
});

vi.mock("@/server/storage/get-signed-asset-url", async () => {
  const { getSignedAssetUrlDouble } =
    await import("../_helpers/agent-api-test-doubles");
  return { getSignedAssetUrl: getSignedAssetUrlDouble };
});

vi.mock("@/server/inngest", async () => {
  const { inngestSendDouble } =
    await import("../_helpers/agent-api-test-doubles");
  return { inngest: { send: inngestSendDouble } };
});

const { GET, POST } = await import("./route");

const LIST_URL = `https://app.test/api/v1/agent/feedbacks?project=${PROJECT_PUBLIC_ID}`;
const CREATE_URL = "https://app.test/api/v1/agent/feedbacks";

const feedbackRow = {
  id: "feedback_1",
  status: "new",
  comment: "The submit button does nothing",
  videoId: null,
  pageUrl: "https://client.test/checkout",
  startMs: null,
  endMs: null,
  frameX: null,
  frameY: null,
  frameWidth: null,
  frameHeight: null,
  selector: "#submit",
  clickX: 12,
  clickY: 34,
  viewportWidth: 1280,
  viewportHeight: 800,
  browserName: "Chrome",
  browserVersion: "120",
  os: "macOS",
  screenshot: { key: "shot.png", provider: "s3", bucket: "assets" },
  metadata: { source: "bugherd" },
  diagnosticTrail: null,
  customMetadata: { userId: "user_42", beta: true },
  reviewer: { name: "Dana" },
  createdAt: new Date("2026-01-02T03:04:05.000Z"),
};

const createdRow = {
  id: "feedback_2",
  status: "new",
  comment: "Typo in the footer",
  pageUrl: "https://client.test/",
  createdAt: new Date("2026-01-02T03:04:05.000Z"),
};

const validCreateBody = {
  project: PROJECT_PUBLIC_ID,
  feedbacks: [
    { comment: "Typo in the footer", pageUrl: "https://client.test/" },
  ],
};

beforeEach(() => {
  resetAgentApiDoubles();
  vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "true");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("GET /api/v1/agent/feedbacks", () => {
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
      agentTokenRow(["feedbacks:create"]),
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
    await expect(response.json()).resolves.toEqual({
      error:
        "Rate limit exceeded. 0 of 1000 read operations remaining this hour. Retry after 1800 seconds (window resets at 2026-01-01T00:30:00.000Z).",
      code: "RATE_LIMITED",
      limit: 1000,
      remaining: 0,
      retryAfterSeconds: 1800,
      resetAt: "2026-01-01T00:30:00.000Z",
    });
  });

  it("rejects a query without a project", async () => {
    const response = await GET(
      agentRequest("https://app.test/api/v1/agent/feedbacks"),
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
        "https://app.test/api/v1/agent/feedbacks?project=someone-elses",
      ),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Project not found",
      code: "NOT_FOUND",
    });
    expect(agentApiPrisma.feedback.findMany).not.toHaveBeenCalled();
  });

  it("lists the project's feedback with its signed screenshot url", async () => {
    agentApiPrisma.feedback.findMany.mockResolvedValue([feedbackRow]);

    const response = await GET(agentRequest(LIST_URL));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      feedbacks: [
        {
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
          screenshotUrl: SIGNED_ASSET_URL,
          metadata: { source: "bugherd" },
          diagnosticTrail: null,
          customMetadata: { userId: "user_42", beta: true },
          reviewerName: "Dana",
          createdAt: "2026-01-02T03:04:05.000Z",
        },
      ],
      count: 1,
    });
    expect(getSignedAssetUrlDouble).toHaveBeenCalledWith({
      key: "shot.png",
      provider: "s3",
      bucket: "assets",
    });
  });

  it("answers the markdown format as a markdown document", async () => {
    agentApiPrisma.feedback.findMany.mockResolvedValue([feedbackRow]);

    const response = await GET(agentRequest(`${LIST_URL}&format=markdown`));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/markdown; charset=utf-8",
    );
    await expect(response.text()).resolves.toContain("# Feedback feedback_1");
  });

  it("carries the Custom metadata section in the markdown format", async () => {
    agentApiPrisma.feedback.findMany.mockResolvedValue([feedbackRow]);

    const response = await GET(agentRequest(`${LIST_URL}&format=markdown`));

    const markdown = await response.text();
    expect(markdown).toContain(
      "## Custom metadata\n\n- userId: user_42\n- beta: true",
    );
  });

  it("returns null Custom metadata for a Feedback that has none", async () => {
    agentApiPrisma.feedback.findMany.mockResolvedValue([
      { ...feedbackRow, customMetadata: null },
    ]);

    const response = await GET(agentRequest(LIST_URL));

    await expect(response.json()).resolves.toMatchObject({
      feedbacks: [{ customMetadata: null }],
    });
  });
});

describe("GET /api/v1/agent/feedbacks with the video filter", () => {
  const VIDEO_URL = `${LIST_URL}&video=${VIDEO_ID}`;

  /** The Video reads as absent unless it belongs to the queried Project. */
  function seedVideo(row: typeof videoRow = videoRow) {
    agentApiPrisma.video.findFirst.mockImplementation(
      async ({ where }: { where: { id: string; projectId: string } }) =>
        where.id === row.id && where.projectId === row.projectId ? row : null,
    );
  }

  /** Narrows the stored rows the way the `where` clause does. */
  function seedFeedbacks(
    rows: Array<Record<string, unknown> & { videoId: string | null }>,
  ) {
    agentApiPrisma.feedback.findMany.mockImplementation(
      async ({ where }: { where: { videoId?: string } }) =>
        rows.filter(
          (row) => where.videoId === undefined || row.videoId === where.videoId,
        ),
    );
  }

  beforeEach(() => {
    seedVideo();
    seedFeedbacks([feedbackRow, videoFeedbackRow]);
  });

  it("lists only that Video's Feedback, opened by the video block", async () => {
    const response = await GET(agentRequest(VIDEO_URL));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      video: {
        id: VIDEO_ID,
        title: "Homepage walkthrough v1",
        filename: "homepage-walkthrough.mp4",
        durationMs: 94200,
        width: 1920,
        height: 1080,
      },
      feedbacks: [
        {
          id: "feedback_video_1",
          status: "new",
          comment: "The logo jumps when the menu opens",
          videoId: VIDEO_ID,
          pageUrl: null,
          selection: {
            startMs: 12340,
            endMs: null,
            point: { x: 0.42, y: 0.61 },
            area: null,
          },
          selector: null,
          clickX: null,
          clickY: null,
          viewportWidth: null,
          viewportHeight: null,
          browserName: "Chrome",
          browserVersion: "142",
          os: "macOS",
          screenshotUrl: SIGNED_ASSET_URL,
          metadata: null,
          diagnosticTrail: null,
          customMetadata: null,
          reviewerName: "Curious Otter",
          createdAt: "2026-11-04T09:12:33.000Z",
        },
      ],
      count: 1,
    });
  });

  it("types a range with an area in the selection", async () => {
    seedFeedbacks([
      {
        ...videoFeedbackRow,
        startMs: 41000,
        endMs: 47500,
        frameX: 0.1,
        frameY: 0.2,
        frameWidth: 0.45,
        frameHeight: 0.5,
      },
    ]);

    const response = await GET(agentRequest(VIDEO_URL));

    await expect(response.json()).resolves.toMatchObject({
      feedbacks: [
        {
          selection: {
            startMs: 41000,
            endMs: 47500,
            point: null,
            area: { x: 0.1, y: 0.2, width: 0.45, height: 0.5 },
          },
        },
      ],
    });
  });

  it("carries videoId on each item of an unfiltered listing and no video block", async () => {
    const response = await GET(agentRequest(LIST_URL));

    const body = (await response.json()) as {
      feedbacks: Array<{ videoId: string | null }>;
      count: number;
    };
    expect(body).not.toHaveProperty("video");
    expect(body.feedbacks.map((f) => f.videoId)).toEqual([null, VIDEO_ID]);
    expect(body.count).toBe(2);
  });

  it("says the Video, the time and the position in the markdown format", async () => {
    const response = await GET(agentRequest(`${VIDEO_URL}&format=markdown`));

    expect(response.status).toBe(200);
    const markdown = await response.text();
    expect(markdown).toContain(
      [
        "## Where to look",
        "",
        "**Video:** Homepage walkthrough v1",
        "**When:** At 00:12.340 (12340 ms)",
        "**Where on the frame:** Point at 42%, 61%",
        "",
        "## What's wrong",
      ].join("\n"),
    );
  });

  it("names the Video of a video item in an unfiltered markdown listing", async () => {
    const response = await GET(agentRequest(`${LIST_URL}&format=markdown`));

    const markdown = await response.text();
    expect(markdown).toContain("**Page URL:** https://client.test/checkout");
    expect(markdown).toContain(
      [
        "**Video:** Homepage walkthrough v1",
        "**When:** At 00:12.340 (12340 ms)",
        "**Where on the frame:** Point at 42%, 61%",
      ].join("\n"),
    );
  });

  it("refuses the video and page_url filters together, naming the conflict", async () => {
    const response = await GET(
      agentRequest(`${VIDEO_URL}&page_url=https://client.test/checkout`),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "The video and page_url filters cannot be combined",
      code: "VALIDATION_ERROR",
    });
    expect(agentApiPrisma.feedback.findMany).not.toHaveBeenCalled();
  });

  it("rejects a video that is not a Video id", async () => {
    const response = await GET(agentRequest(`${LIST_URL}&video=not-an-id`));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
    });
  });

  it("reports a Video of another Project as not found", async () => {
    seedVideo({ ...videoRow, projectId: "someone-elses-project" });

    const response = await GET(agentRequest(VIDEO_URL));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Video not found",
      code: "NOT_FOUND",
    });
    expect(agentApiPrisma.feedback.findMany).not.toHaveBeenCalled();
  });
});

describe("POST /api/v1/agent/feedbacks", () => {
  beforeEach(() => {
    agentApiPrisma.feedback.count.mockResolvedValue(0);
    agentApiPrisma.feedback.create.mockResolvedValue(createdRow);
    agentApiPrisma.reviewer.findFirst.mockResolvedValue({
      id: REVIEWER_ID,
      name: "Imported feedback",
      isActive: true,
    });
  });

  it("refuses a token that lacks the create scope", async () => {
    agentApiPrisma.agentToken.findFirst.mockResolvedValue(
      agentTokenRow(["feedbacks:read"]),
    );

    const response = await POST(
      agentRequest(CREATE_URL, { method: "POST", body: validCreateBody }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Insufficient permissions",
      code: "FORBIDDEN",
    });
  });

  it("rejects a body that is not JSON", async () => {
    const response = await POST(
      agentRequest(CREATE_URL, { method: "POST", rawBody: "{" }),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid JSON body",
      code: "VALIDATION_ERROR",
    });
  });

  it("rejects a body that does not match the schema", async () => {
    const response = await POST(
      agentRequest(CREATE_URL, {
        method: "POST",
        body: { project: PROJECT_PUBLIC_ID, feedbacks: [] },
      }),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
    });
  });

  it("reports a project outside the token's organization as not found", async () => {
    const response = await POST(
      agentRequest(CREATE_URL, {
        method: "POST",
        body: { ...validCreateBody, project: "someone-elses" },
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Project not found",
      code: "NOT_FOUND",
    });
    expect(agentApiPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("refuses the whole batch when it would cross the plan limit", async () => {
    agentApiPrisma.feedback.count.mockResolvedValue(50);

    const response = await POST(
      agentRequest(CREATE_URL, { method: "POST", body: validCreateBody }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Feedback limit would be exceeded by this batch.",
      code: "RESOURCE_LIMIT_EXCEEDED",
      current: 50,
      limit: 50,
      requested: 1,
    });
    expect(agentApiPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("creates the batch and reports the reviewer it imported under", async () => {
    const response = await POST(
      agentRequest(CREATE_URL, {
        method: "POST",
        body: { ...validCreateBody, source: "bugherd" },
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      created: 1,
      feedbacks: [
        {
          id: "feedback_2",
          status: "new",
          comment: "Typo in the footer",
          pageUrl: "https://client.test/",
          createdAt: "2026-01-02T03:04:05.000Z",
        },
      ],
      reviewer: { id: REVIEWER_ID, name: "Imported feedback" },
      atLimit: false,
    });
    expect(agentApiPrisma.feedback.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: PROJECT_ID,
          reviewerId: REVIEWER_ID,
          status: "new",
          metadata: { source: "bugherd" },
        }),
      }),
    );
  });

  it("reports the caller as at the cap once the batch fills the plan", async () => {
    agentApiPrisma.feedback.count
      .mockResolvedValueOnce(49)
      .mockResolvedValueOnce(50);

    const response = await POST(
      agentRequest(CREATE_URL, { method: "POST", body: validCreateBody }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ atLimit: true });
  });

  it("does not fan out to the integrations on an import", async () => {
    await POST(
      agentRequest(CREATE_URL, { method: "POST", body: validCreateBody }),
    );

    expect(inngestSendDouble).not.toHaveBeenCalled();
  });
});
