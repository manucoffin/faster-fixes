import realRecording from "@/app/_domains/feedback/_helpers/read-recording-steps.real-recording.json";
import { RECORDING_STEPS_VERSION } from "@/app/_domains/feedback/_helpers/read-recording-steps";
import { gzipSync } from "node:zlib";
import type { GetFeedbackOutput } from "@/app/_domains/feedback/_services/get-feedback";
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

const getStorageObjectDouble = vi.fn();
vi.mock("@/server/storage/objects", () => ({
  getStorageObject: getStorageObjectDouble,
}));

const { GET } = await import("./route");

/** The JSON item, timestamps as strings aside. */
async function readItem(response: Response) {
  return (await response.json()) as GetFeedbackOutput["item"];
}

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
  recording: null,
  recordingDurationMs: null,
  recordingFormatVersion: null,
  recordingSteps: null,
  recordingStepsVersion: null,
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

describe("GET /api/v1/agent/feedbacks/[id] with a Recording", () => {
  const RECORDING_KEY = "recordings/feedback.json.gz";
  const RECORDING_URL = `https://assets.example.test/signed/${RECORDING_KEY}`;
  const recordingFile = gzipSync(JSON.stringify(realRecording));
  const timestamps = realRecording.map(({ timestamp }) => timestamp);
  const startedAt = Math.min(...timestamps);
  const endedAt = Math.max(...timestamps);

  const recordingRow = {
    ...feedbackRow,
    diagnosticTrail: {
      console: [
        { level: "error", message: "Save failed", timestamp: endedAt - 500 },
      ],
      network: [
        {
          method: "POST",
          url: "https://client.test/api/settings",
          status: 500,
          duration: 120,
          timestamp: endedAt - 800,
        },
      ],
    },
    recording: { key: RECORDING_KEY },
    recordingDurationMs: endedAt - startedAt,
    recordingFormatVersion: 1,
  };

  beforeEach(() => {
    seedFeedback(recordingRow);
    getStorageObjectDouble.mockResolvedValue(recordingFile);
    agentApiPrisma.feedback.update.mockResolvedValue({ id: FEEDBACK_ID });
    getSignedAssetUrlDouble.mockImplementation(
      async ({ key }: { key: string }) =>
        `https://assets.example.test/signed/${key}`,
    );
  });

  function markdownRequest() {
    return GET(agentRequest(`${FEEDBACK_URL}?format=markdown`), routeContext());
  }

  it("carries the Recording's steps, both ends and a signed link beside an untouched diagnosticTrail", async () => {
    const response = await GET(agentRequest(FEEDBACK_URL), routeContext());

    expect(response.status).toBe(200);
    const body = await readItem(response);
    expect(body.diagnosticTrail).toEqual(recordingRow.diagnosticTrail);
    expect(body.screenshotUrl).toBe(
      "https://assets.example.test/signed/shot.png",
    );
    expect(body.recording).toMatchObject({
      durationMs: endedAt - startedAt,
      startedAt,
      endedAt,
      url: RECORDING_URL,
      readable: true,
    });
    expect(body.recording?.steps.length).toBeGreaterThan(1);
    expect(body.recording?.steps.at(-1)).toEqual({
      type: "selection",
      timestamp: endedAt,
      offsetMs: 0,
      label: 'button "Save"',
      selector: "#save",
      detail: null,
    });
    expect(getSignedAssetUrlDouble).toHaveBeenCalledWith({
      key: RECORDING_KEY,
    });
    expect(getStorageObjectDouble).toHaveBeenCalledWith({
      key: RECORDING_KEY,
    });
  });

  it("puts the Timeline in place of Diagnostics, ending with the Selection, without the file's link", async () => {
    const response = await markdownRequest();

    expect(response.status).toBe(200);
    const markdown = await response.text();
    expect(markdown).not.toContain("## Diagnostics");
    expect(markdown).toContain("## Timeline");
    expect(markdown).toContain(
      "- -0.8 s  `POST` https://client.test/api/settings → 500 (120ms)",
    );
    expect(markdown).toContain("- -0.5 s  `error` Save failed");
    expect(markdown).toContain(
      '- 0.0 s  selection button "Save" (#save), the element the comment is about\n\n## Screenshot',
    );
    expect(markdown).not.toContain(RECORDING_URL);
  });

  it("keeps the whole markdown of the real Recording's Feedback under 10,000 tokens", async () => {
    const markdown = await (await markdownRequest()).text();

    // About four characters a token in English; three keeps a margin.
    expect(markdown.length / 3).toBeLessThan(10_000);
  });

  it("caches the derived steps on the first call and reads the cache on the next", async () => {
    const first = await readItem(
      await GET(agentRequest(FEEDBACK_URL), routeContext()),
    );

    expect(agentApiPrisma.feedback.update).toHaveBeenCalledTimes(1);
    const [{ where, data }] = agentApiPrisma.feedback.update.mock.calls[0] as [
      { where: unknown; data: Record<string, unknown> },
    ];
    expect(where).toEqual({ id: FEEDBACK_ID });
    expect(data.recordingStepsVersion).toBe(RECORDING_STEPS_VERSION);

    seedFeedback({ ...recordingRow, ...data });
    getStorageObjectDouble.mockClear();
    agentApiPrisma.feedback.update.mockClear();

    const second = await readItem(
      await GET(agentRequest(FEEDBACK_URL), routeContext()),
    );

    expect(getStorageObjectDouble).not.toHaveBeenCalled();
    expect(agentApiPrisma.feedback.update).not.toHaveBeenCalled();
    expect(second.recording).toEqual(first.recording);
  });

  it("derives again a cache from an older derivation version", async () => {
    seedFeedback({
      ...recordingRow,
      recordingSteps: { startedAt, endedAt, steps: [] },
      recordingStepsVersion: RECORDING_STEPS_VERSION - 1,
    });

    const body = await readItem(
      await GET(agentRequest(FEEDBACK_URL), routeContext()),
    );

    expect(getStorageObjectDouble).toHaveBeenCalledTimes(1);
    expect(body.recording?.steps.length).toBeGreaterThan(1);
    expect(agentApiPrisma.feedback.update).toHaveBeenCalledTimes(1);
  });

  it("answers a Feedback whose Recording has not arrived as one without a Recording", async () => {
    seedFeedback({
      ...recordingRow,
      recording: null,
      recordingDurationMs: null,
      recordingFormatVersion: null,
    });

    const body = await readItem(
      await GET(agentRequest(FEEDBACK_URL), routeContext()),
    );
    expect(body.recording).toBeNull();
    await expect((await markdownRequest()).text()).resolves.toContain(
      "## Diagnostics",
    );
    expect(getStorageObjectDouble).not.toHaveBeenCalled();
  });

  it.each([
    [
      "the object is missing",
      () => getStorageObjectDouble.mockResolvedValue(null),
    ],
    [
      "the file is not gzip",
      () => getStorageObjectDouble.mockResolvedValue(Buffer.from("[]")),
    ],
    [
      "the file inflates past the cap",
      () =>
        getStorageObjectDouble.mockResolvedValue(
          gzipSync(Buffer.alloc(65 * 1024 * 1024)),
        ),
    ],
    [
      "the format version is unknown",
      () => seedFeedback({ ...recordingRow, recordingFormatVersion: 99 }),
    ],
  ])("still answers 200 with the fallback when %s", async (_, arrange) => {
    arrange();

    const json = await GET(agentRequest(FEEDBACK_URL), routeContext());
    expect(json.status).toBe(200);
    const body = await readItem(json);
    expect(body.recording).toEqual({
      durationMs: endedAt - startedAt,
      startedAt: null,
      endedAt: null,
      url: RECORDING_URL,
      readable: false,
      steps: [],
    });
    expect(body.diagnosticTrail).toEqual(recordingRow.diagnosticTrail);

    const markdown = await markdownRequest();
    expect(markdown.status).toBe(200);
    const text = await markdown.text();
    expect(text).toContain("## Diagnostics");
    expect(text).not.toContain("## Timeline");
    expect(text).toContain(
      "**Recording:** the file could not be read, so this Feedback has no timeline.",
    );
    expect(agentApiPrisma.feedback.update).not.toHaveBeenCalled();
  });
});
