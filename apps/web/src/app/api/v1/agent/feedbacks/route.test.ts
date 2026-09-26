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
  pageUrl: "https://client.test/checkout",
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
          pageUrl: "https://client.test/checkout",
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
