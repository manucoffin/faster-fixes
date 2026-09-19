/**
 * Characterization tests: they pin what an Agent-token caller observes today
 * (status, JSON body, headers) so the step 4 move to a service behind a route
 * boundary can be proven byte-compatible. They assert on responses only, never
 * on how the handler reaches them, with one exception noted in place.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  agentApiPrisma,
  agentRequest,
  agentTokenRow,
  blockRateLimit,
  inngestSendDouble,
  PROJECT_ID,
  resetAgentApiDoubles,
} from "../../../_helpers/agent-api-test-doubles";

vi.mock("@workspace/db", async () => {
  const { agentApiPrisma } =
    await import("../../../_helpers/agent-api-test-doubles");
  return { prisma: agentApiPrisma };
});

vi.mock("@/server/inngest", async () => {
  const { inngestSendDouble } =
    await import("../../../_helpers/agent-api-test-doubles");
  return { inngest: { send: inngestSendDouble } };
});

const { POST } = await import("./route");

const FEEDBACK_ID = "11111111-1111-4111-8111-111111111111";
const STATUS_URL = `https://app.test/api/v1/agent/feedbacks/${FEEDBACK_ID}/status`;

const UPDATED_AT = new Date("2026-01-02T03:04:05.000Z");

/** Next hands the handler its dynamic segments as a promise. */
function routeContext(id: string = FEEDBACK_ID) {
  return { params: Promise.resolve({ id }) };
}

function statusRequest(body: unknown, url = STATUS_URL) {
  return agentRequest(url, { method: "POST", body });
}

/**
 * Stands in for the row the handler reads, filtered the way the query is: the
 * feedback is only visible when its project is one of the token organization's.
 * A feedback on another organization's project therefore reads as absent, which
 * is what the 404 case asserts.
 */
function seedFeedback({
  projectId = PROJECT_ID,
  status = "new",
}: { projectId?: string; status?: string } = {}) {
  agentApiPrisma.feedback.findFirst.mockImplementation(
    async ({ where }: { where: { projectId: { in: string[] } } }) =>
      where.projectId.in.includes(projectId)
        ? { id: FEEDBACK_ID, status }
        : null,
  );
  agentApiPrisma.feedback.update.mockImplementation(
    async ({ data }: { data: { status: string } }) => ({
      id: FEEDBACK_ID,
      status: data.status,
      updatedAt: UPDATED_AT,
    }),
  );
}

beforeEach(() => {
  resetAgentApiDoubles();
  vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "true");
  seedFeedback();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("POST /api/v1/agent/feedbacks/[id]/status", () => {
  it("refuses a request without an agent token", async () => {
    const response = await POST(
      agentRequest(STATUS_URL, {
        method: "POST",
        token: null,
        body: { status: "resolved" },
      }),
      routeContext(),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    });
  });

  it("refuses a token that lacks the update_status scope", async () => {
    agentApiPrisma.agentToken.findFirst.mockResolvedValue(
      agentTokenRow(["feedbacks:read", "feedbacks:create"]),
    );

    const response = await POST(
      statusRequest({ status: "resolved" }),
      routeContext(),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Insufficient permissions",
      code: "FORBIDDEN",
    });
  });

  it("answers a rate limited caller with the write ceiling and its retry headers", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    blockRateLimit();

    const response = await POST(
      statusRequest({ status: "resolved" }),
      routeContext(),
    );

    expect(response.status).toBe(429);
    expect(Object.fromEntries(response.headers)).toMatchObject({
      "retry-after": "1800",
      "x-ratelimit-limit": "120",
      "x-ratelimit-remaining": "0",
      "x-ratelimit-reset": String(
        Math.floor(new Date("2026-01-01T00:30:00.000Z").getTime() / 1000),
      ),
    });
    await expect(response.json()).resolves.toEqual({
      error:
        "Rate limit exceeded. 0 of 120 write operations remaining this hour. Retry after 1800 seconds (window resets at 2026-01-01T00:30:00.000Z).",
      code: "RATE_LIMITED",
      limit: 120,
      remaining: 0,
      retryAfterSeconds: 1800,
      resetAt: "2026-01-01T00:30:00.000Z",
    });
  });

  it("rejects an id that is not a feedback id", async () => {
    const response = await POST(
      statusRequest(
        { status: "resolved" },
        "https://app.test/api/v1/agent/feedbacks/not-an-id/status",
      ),
      routeContext("not-an-id"),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid feedback ID",
      code: "VALIDATION_ERROR",
    });
  });

  it("rejects a body that is not JSON", async () => {
    const response = await POST(
      agentRequest(STATUS_URL, { method: "POST", rawBody: "{" }),
      routeContext(),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid JSON body",
      code: "VALIDATION_ERROR",
    });
  });

  it("rejects a status outside the vocabulary", async () => {
    const response = await POST(
      statusRequest({ status: "archived" }),
      routeContext(),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
    });
  });

  it("reports a feedback outside the token's organization as not found", async () => {
    seedFeedback({ projectId: "someone-elses-project" });

    const response = await POST(
      statusRequest({ status: "resolved" }),
      routeContext(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Feedback not found",
      code: "NOT_FOUND",
    });
    expect(agentApiPrisma.feedback.update).not.toHaveBeenCalled();
  });

  it("updates the status and reports the stored row", async () => {
    const response = await POST(
      statusRequest({ status: "resolved" }),
      routeContext(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: FEEDBACK_ID,
      status: "resolved",
      updatedAt: "2026-01-02T03:04:05.000Z",
    });
  });

  it("fans the change out to the integrations as the agent actor", async () => {
    await POST(statusRequest({ status: "in_progress" }), routeContext());

    expect(inngestSendDouble).toHaveBeenCalledWith({
      name: "feedback/status-changed",
      data: {
        feedbackId: FEEDBACK_ID,
        newStatus: "in_progress",
        actor: "agent",
      },
    });
  });

  /**
   * The gap with the dashboard service (which does emit here) was settled in
   * favour of keeping it: an agent looping over a queue re-sets the status it
   * already read, and the fan-out is the costly half of the write. See the
   * migration log, decision 10. The fan-out is not visible in the response, so
   * this one assertion looks past it.
   */
  it("answers a no-op status set with the row and sends no event", async () => {
    seedFeedback({ status: "resolved" });

    const response = await POST(
      statusRequest({ status: "resolved" }),
      routeContext(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: FEEDBACK_ID,
      status: "resolved",
      updatedAt: "2026-01-02T03:04:05.000Z",
    });
    expect(agentApiPrisma.feedback.update).toHaveBeenCalledTimes(1);
    expect(inngestSendDouble).not.toHaveBeenCalled();
  });
});
