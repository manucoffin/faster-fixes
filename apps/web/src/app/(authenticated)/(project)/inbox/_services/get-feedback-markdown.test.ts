import realRecording from "@/app/_domains/feedback/_helpers/read-recording-steps.real-recording.json";
import {
  agentApiPrisma,
  agentRequest,
  getSignedAssetUrlDouble,
  PROJECT_ID,
  resetAgentApiDoubles,
} from "@/app/api/v1/agent/_helpers/agent-api-test-doubles";
import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { gzipSync } from "node:zlib";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFeedbackMarkdown } from "./get-feedback-markdown";

vi.mock("@workspace/db", async () => {
  const { agentApiPrisma } =
    await import("@/app/api/v1/agent/_helpers/agent-api-test-doubles");
  return { prisma: agentApiPrisma };
});

vi.mock("@/server/storage/get-signed-asset-url", async () => {
  const { getSignedAssetUrlDouble } =
    await import("@/app/api/v1/agent/_helpers/agent-api-test-doubles");
  return { getSignedAssetUrl: getSignedAssetUrlDouble };
});

const { getStorageObjectDouble } = vi.hoisted(() => ({
  getStorageObjectDouble: vi.fn(),
}));
vi.mock("@/server/storage/objects", () => ({
  getStorageObject: getStorageObjectDouble,
}));

// The agent route is the reference: the copy must equal its markdown.
const { GET } = await import("@/app/api/v1/agent/feedbacks/[id]/route");

type FakeDb = NonNullable<Parameters<typeof getFeedbackMarkdown>[1]>;

const FEEDBACK_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "user_1";
const RECORDING_KEY = "recordings/feedback.json.gz";

const timestamps = realRecording.map(({ timestamp }) => timestamp);
const startedAt = Math.min(...timestamps);
const endedAt = Math.max(...timestamps);

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
    console: [
      { level: "error", message: "Save failed", timestamp: endedAt - 500 },
    ],
    network: [],
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

const recordingRow = {
  ...feedbackRow,
  recording: { key: RECORDING_KEY },
  recordingDurationMs: endedAt - startedAt,
  recordingFormatVersion: 1,
};

/** Visible only through its own Project, as the query filters it. */
function seedFeedback(row: Record<string, unknown>) {
  agentApiPrisma.feedback.findFirst.mockImplementation(
    async ({ where }: { where: { projectId: { in: string[] } } }) =>
      where.projectId.in.includes(PROJECT_ID) ? row : null,
  );
}

function fakeDb(membership: { id: string } | null) {
  return {
    ...agentApiPrisma,
    project: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
        where.id === PROJECT_ID
          ? { id: PROJECT_ID, organizationId: "organization_1" }
          : null,
      ),
    },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
  } as unknown as FakeDb;
}

async function agentMarkdown() {
  const response = await GET(
    agentRequest(
      `https://app.test/api/v1/agent/feedbacks/${FEEDBACK_ID}?format=markdown`,
    ),
    { params: Promise.resolve({ id: FEEDBACK_ID }) },
  );
  expect(response.status).toBe(200);
  return response.text();
}

const input = {
  projectId: PROJECT_ID,
  feedbackId: FEEDBACK_ID,
  userId: USER_ID,
};

beforeEach(() => {
  resetAgentApiDoubles();
  vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "true");
  agentApiPrisma.feedback.update.mockResolvedValue({ id: FEEDBACK_ID });
  getStorageObjectDouble.mockResolvedValue(
    gzipSync(JSON.stringify(realRecording)),
  );
  getSignedAssetUrlDouble.mockImplementation(
    async ({ key }: { key: string }) =>
      `https://assets.example.test/signed/${key}`,
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getFeedbackMarkdown", () => {
  it("gives a Member the agent route's document, Timeline included, for a Feedback with a Recording", async () => {
    seedFeedback(recordingRow);

    const markdown = await getFeedbackMarkdown(input, fakeDb({ id: "m_1" }));

    expect(markdown).toContain("## Timeline");
    expect(markdown).not.toContain("## Diagnostics");
    expect(markdown).toBe(await agentMarkdown());
  });

  it("gives a Member the agent route's document, Diagnostics included, for a Feedback without a Recording", async () => {
    seedFeedback(feedbackRow);

    const markdown = await getFeedbackMarkdown(input, fakeDb({ id: "m_1" }));

    expect(markdown).toContain("## Diagnostics");
    expect(markdown).toContain("- `error` Save failed");
    expect(markdown).toBe(await agentMarkdown());
  });

  it("refuses a user who is not a Member of the Project's Organization", async () => {
    seedFeedback(feedbackRow);

    await expect(getFeedbackMarkdown(input, fakeDb(null))).rejects.toThrow(
      new ForbiddenError("Access denied."),
    );
    expect(agentApiPrisma.feedback.findFirst).not.toHaveBeenCalled();
  });

  it("reports an unknown Project as not found", async () => {
    await expect(
      getFeedbackMarkdown(
        { ...input, projectId: "project_other" },
        fakeDb({ id: "m_1" }),
      ),
    ).rejects.toThrow(new NotFoundError("Project not found."));
  });

  it("reports a Feedback of another Project as not found", async () => {
    agentApiPrisma.feedback.findFirst.mockResolvedValue(null);

    await expect(
      getFeedbackMarkdown(input, fakeDb({ id: "m_1" })),
    ).rejects.toThrow(new NotFoundError("Feedback not found"));
  });
});
