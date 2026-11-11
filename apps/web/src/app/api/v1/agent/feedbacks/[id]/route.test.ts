import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  agentApiPrisma,
  agentRequest,
  agentTokenRow,
  getSignedAssetUrlDouble,
  PROJECT_ID,
  resetAgentApiDoubles,
  SIGNED_ASSET_URL,
  VIDEO_ID,
  videoFeedbackRow,
} from "../../_helpers/agent-api-test-doubles";

vi.mock("@workspace/db", async () => {
  const { agentApiPrisma } =
    await import("../../_helpers/agent-api-test-doubles");
  return { prisma: agentApiPrisma };
});

vi.mock("@/server/storage/get-signed-asset-url", async () => {
  const { getSignedAssetUrlDouble } =
    await import("../../_helpers/agent-api-test-doubles");
  return { getSignedAssetUrl: getSignedAssetUrlDouble };
});

const { GET } = await import("./route");

const FEEDBACK_ID = "11111111-1111-4111-8111-111111111111";
const FEEDBACK_URL = `https://app.test/api/v1/agent/feedbacks/${FEEDBACK_ID}`;

const feedbackRow = {
  id: FEEDBACK_ID,
  status: "new",
  comment: "The save button does nothing",
  videoId: null,
  pageUrl: "https://client.test/settings",
  startMs: null,
  endMs: null,
  frameX: null,
  frameY: null,
  frameWidth: null,
  frameHeight: null,
  selector: "#save",
  clickX: 12,
  clickY: 34,
  viewportWidth: 1280,
  viewportHeight: 800,
  browserName: "Chrome",
  browserVersion: "142",
  os: "macOS",
  screenshot: { key: "shot.png", provider: "s3", bucket: "assets" },
  metadata: { elementDescription: 'button "Save"' },
  diagnosticTrail: {
    console: [{ level: "error", message: "Save failed", timestamp: 1 }],
    network: [
      {
        method: "POST",
        url: "https://client.test/api/settings",
        status: 500,
        duration: 120,
        timestamp: 2,
      },
    ],
  },
  customMetadata: null,
  reviewer: { name: "Dana" },
  video: null,
  createdAt: new Date("2026-11-04T09:12:33.000Z"),
};

/** Next hands the handler its dynamic segments as a promise. */
function routeContext(id: string = FEEDBACK_ID) {
  return { params: Promise.resolve({ id }) };
}

/**
 * Stands in for the row the handler reads, filtered the way the query is: a
 * Feedback is only visible when its Project is one of the token Organization's.
 */
function seedFeedback(
  row: Record<string, unknown> = feedbackRow,
  projectId: string = PROJECT_ID,
) {
  agentApiPrisma.feedback.findFirst.mockImplementation(
    async ({ where }: { where: { projectId: { in: string[] } } }) =>
      where.projectId.in.includes(projectId) ? row : null,
  );
}

beforeEach(() => {
  resetAgentApiDoubles();
  vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "true");
  seedFeedback();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/v1/agent/feedbacks/[id]", () => {
  it("answers the Feedback as the listing's item plus a null recording", async () => {
    const response = await GET(agentRequest(FEEDBACK_URL), routeContext());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: FEEDBACK_ID,
      status: "new",
      comment: "The save button does nothing",
      videoId: null,
      pageUrl: "https://client.test/settings",
      selection: null,
      selector: "#save",
      clickX: 12,
      clickY: 34,
      viewportWidth: 1280,
      viewportHeight: 800,
      browserName: "Chrome",
      browserVersion: "142",
      os: "macOS",
      screenshotUrl: SIGNED_ASSET_URL,
      metadata: { elementDescription: 'button "Save"' },
      diagnosticTrail: feedbackRow.diagnosticTrail,
      customMetadata: null,
      reviewerName: "Dana",
      createdAt: "2026-11-04T09:12:33.000Z",
      recording: null,
    });
    expect(getSignedAssetUrlDouble).toHaveBeenCalledWith({
      key: "shot.png",
      provider: "s3",
      bucket: "assets",
    });
  });

  it("answers a null screenshotUrl for a Feedback without a Screenshot", async () => {
    seedFeedback({ ...feedbackRow, screenshot: null });

    const response = await GET(agentRequest(FEEDBACK_URL), routeContext());

    await expect(response.json()).resolves.toMatchObject({
      screenshotUrl: null,
    });
    expect(getSignedAssetUrlDouble).not.toHaveBeenCalled();
  });

  it("answers the markdown format as the Feedback's document, Diagnostics included", async () => {
    const response = await GET(
      agentRequest(`${FEEDBACK_URL}?format=markdown`),
      routeContext(),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/markdown; charset=utf-8",
    );
    const markdown = await response.text();
    expect(markdown).toMatch(
      /^# Feedback 11111111-1111-4111-8111-111111111111/,
    );
    expect(markdown).toContain("## Diagnostics");
    expect(markdown).toContain("- `error` Save failed");
    expect(markdown).toContain(
      "- `POST` https://client.test/api/settings → 500 (120ms)",
    );
    expect(markdown).not.toContain("---");
  });

  it("serves a Feedback on a Video, naming the Video in markdown", async () => {
    seedFeedback({ ...videoFeedbackRow, id: FEEDBACK_ID });

    const json = await GET(agentRequest(FEEDBACK_URL), routeContext());
    await expect(json.json()).resolves.toMatchObject({
      id: FEEDBACK_ID,
      videoId: VIDEO_ID,
      selection: { startMs: 12340, point: { x: 0.42, y: 0.61 } },
      recording: null,
    });

    const markdown = await GET(
      agentRequest(`${FEEDBACK_URL}?format=markdown`),
      routeContext(),
    );
    await expect(markdown.text()).resolves.toContain(
      "**Video:** Homepage walkthrough v1",
    );
  });

  it("answers a Feedback of another Organization as not found", async () => {
    seedFeedback(feedbackRow, "someone-elses-project");

    const response = await GET(agentRequest(FEEDBACK_URL), routeContext());

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Feedback not found",
      code: "NOT_FOUND",
    });
  });

  it("rejects an id that is not a Feedback id", async () => {
    const response = await GET(
      agentRequest("https://app.test/api/v1/agent/feedbacks/not-an-id"),
      routeContext("not-an-id"),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid feedback ID",
      code: "VALIDATION_ERROR",
    });
    expect(agentApiPrisma.feedback.findFirst).not.toHaveBeenCalled();
  });

  it("rejects an unknown format", async () => {
    const response = await GET(
      agentRequest(`${FEEDBACK_URL}?format=html`),
      routeContext(),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
    });
  });

  it("refuses a request without an agent token", async () => {
    const response = await GET(
      agentRequest(FEEDBACK_URL, { token: null }),
      routeContext(),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    });
  });

  it("refuses a token that is not known", async () => {
    agentApiPrisma.agentToken.findFirst.mockResolvedValue(null);

    const response = await GET(
      agentRequest(FEEDBACK_URL, { token: "ff_agent_unknown" }),
      routeContext(),
    );

    expect(response.status).toBe(401);
    expect(agentApiPrisma.feedback.findFirst).not.toHaveBeenCalled();
  });

  it("refuses a token that lacks the read scope", async () => {
    agentApiPrisma.agentToken.findFirst.mockResolvedValue(
      agentTokenRow(["feedbacks:create", "feedbacks:update_status"]),
    );

    const response = await GET(agentRequest(FEEDBACK_URL), routeContext());

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Insufficient permissions",
      code: "FORBIDDEN",
    });
    expect(agentApiPrisma.feedback.findFirst).not.toHaveBeenCalled();
  });
});
