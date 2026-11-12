import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAssetDouble,
  FEEDBACK_ID,
  feedbackRow,
  inngestSendDouble,
  PROJECT_ID,
  putObjectDouble,
  resetWidgetApiDoubles,
  STORAGE_BUCKET,
  widgetApiPrisma,
  widgetRequest,
} from "../../_helpers/widget-api-test-doubles";

vi.mock("@workspace/db", async () => {
  const { widgetApiPrisma } =
    await import("../../_helpers/widget-api-test-doubles");
  return { prisma: widgetApiPrisma };
});

vi.mock("@better-upload/server/clients", () => ({ cloudflare: () => ({}) }));

vi.mock("@/server/storage/create-asset", async () => {
  const { createAssetDouble } =
    await import("../../_helpers/widget-api-test-doubles");
  return { createAsset: createAssetDouble };
});

vi.mock("@/server/inngest", async () => {
  const { inngestSendDouble } =
    await import("../../_helpers/widget-api-test-doubles");
  return { inngest: { send: inngestSendDouble } };
});

vi.mock("@better-upload/server/helpers", async () => {
  const { putObjectDouble } =
    await import("../../_helpers/widget-api-test-doubles");
  return { putObject: putObjectDouble };
});

const { PUT } = await import("./route");

const ROUTE_URL = `https://app.test/api/v1/feedback/${FEEDBACK_ID}/recording`;
const RECORDING_ASSET_ID = "asset_recording_1";

const routeParams = { params: Promise.resolve({ id: FEEDBACK_ID }) };

function recordingFile(bytes = 16) {
  return new File([new Uint8Array(bytes)], "recording.gz", {
    type: "application/gzip",
  });
}

type RecordingFormInit = {
  file?: File | null;
  durationMs?: string | null;
  formatVersion?: string | null;
};

function recordingForm({
  file = recordingFile(),
  durationMs = "42000",
  formatVersion = "1",
}: RecordingFormInit = {}) {
  const formData = new FormData();
  if (file) formData.set("recording", file);
  if (durationMs !== null) formData.set("durationMs", durationMs);
  if (formatVersion !== null) formData.set("formatVersion", formatVersion);
  return formData;
}

function attachRequest(body: BodyInit = recordingForm(), overrides = {}) {
  return widgetRequest(ROUTE_URL, { method: "PUT", body, ...overrides });
}

beforeEach(() => {
  resetWidgetApiDoubles();
  vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "true");
  vi.stubEnv("STORAGE_BUCKET_NAME", STORAGE_BUCKET);
  createAssetDouble.mockResolvedValue({ id: RECORDING_ASSET_ID });
  widgetApiPrisma.feedback.update.mockResolvedValue({ id: FEEDBACK_ID });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("PUT /api/v1/feedback/:id/recording", () => {
  it("stores the file and links it to the feedback with its duration and format version", async () => {
    const response = await PUT(attachRequest(), routeParams);

    expect(response.status).toBe(204);
    expect(putObjectDouble).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        bucket: STORAGE_BUCKET,
        key: expect.stringMatching(
          new RegExp(`^feedback-recordings/${PROJECT_ID}/.+\\.gz$`),
        ),
        contentType: "application/gzip",
      }),
    );
    expect(createAssetDouble).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: "recording.gz",
        mimeType: "application/gzip",
        size: 16n,
      }),
    );
    expect(widgetApiPrisma.feedback.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: FEEDBACK_ID },
        data: {
          recordingId: RECORDING_ASSET_ID,
          recordingDurationMs: 42000,
          recordingFormatVersion: 1,
        },
      }),
    );
  });

  it("tells the integrations the Recording is attached", async () => {
    await PUT(attachRequest(), routeParams);

    expect(inngestSendDouble).toHaveBeenCalledWith({
      name: "feedback/recording-attached",
      data: { feedbackId: FEEDBACK_ID },
    });
  });

  it("answers success when the integrations cannot be told", async () => {
    inngestSendDouble.mockRejectedValue(new Error("event API down"));

    const response = await PUT(attachRequest(), routeParams);

    expect(response.status).toBe(204);
  });

  it("tells the integrations nothing when the upload is refused", async () => {
    widgetApiPrisma.feedback.findFirst.mockResolvedValue(
      feedbackRow({ recordingId: "asset_already_there" }),
    );

    const response = await PUT(attachRequest(), routeParams);

    expect(response.status).toBe(409);
    expect(inngestSendDouble).not.toHaveBeenCalled();
  });

  it("stores the bytes as received, without decompressing them", async () => {
    const bytes = new Uint8Array([0x1f, 0x8b, 8, 0, 1, 2, 3]);
    const file = new File([bytes], "recording.gz");

    await PUT(attachRequest(recordingForm({ file })), routeParams);

    const [, { body }] = putObjectDouble.mock.calls[0] as [
      unknown,
      { body: Buffer },
    ];
    expect([...body]).toEqual([...bytes]);
  });

  it("accepts a recording that lasts no time at all", async () => {
    const response = await PUT(
      attachRequest(recordingForm({ durationMs: "0" })),
      routeParams,
    );

    expect(response.status).toBe(204);
  });

  it("refuses an unknown project identifier", async () => {
    widgetApiPrisma.project.findFirst.mockResolvedValue(null);

    const response = await PUT(attachRequest(), routeParams);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(putObjectDouble).not.toHaveBeenCalled();
  });

  it("refuses an origin outside the project's registered domain", async () => {
    const response = await PUT(
      attachRequest(recordingForm(), { origin: "https://evil.test" }),
      routeParams,
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Origin not allowed",
    });
  });

  it("refuses an invalid reviewer token", async () => {
    widgetApiPrisma.reviewer.findFirst.mockResolvedValue(null);

    const response = await PUT(attachRequest(), routeParams);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid reviewer token",
    });
    expect(putObjectDouble).not.toHaveBeenCalled();
  });

  it("answers not found for a feedback outside the project, before reading the body", async () => {
    widgetApiPrisma.feedback.findFirst.mockResolvedValue(null);

    const response = await PUT(
      attachRequest("not-a-multipart-body", {
        headers: { "content-type": "multipart/form-data; boundary=broken" },
      }),
      routeParams,
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Feedback not found",
    });
    expect(widgetApiPrisma.feedback.findFirst).toHaveBeenCalledWith({
      where: { id: FEEDBACK_ID, projectId: PROJECT_ID },
    });
  });

  it("refuses a feedback created by another reviewer of the project", async () => {
    widgetApiPrisma.feedback.findFirst.mockResolvedValue(
      feedbackRow({ reviewerId: "reviewer_2" }),
    );

    const response = await PUT(attachRequest(), routeParams);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Feedback belongs to another reviewer",
    });
    expect(putObjectDouble).not.toHaveBeenCalled();
  });

  it("refuses to overwrite a recording that is already attached", async () => {
    widgetApiPrisma.feedback.findFirst.mockResolvedValue(
      feedbackRow({ recordingId: "asset_already_there" }),
    );

    const response = await PUT(attachRequest(), routeParams);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Recording already attached",
    });
    expect(putObjectDouble).not.toHaveBeenCalled();
    expect(widgetApiPrisma.feedback.update).not.toHaveBeenCalled();
  });

  it("refuses a feedback on a video", async () => {
    widgetApiPrisma.feedback.findFirst.mockResolvedValue(
      feedbackRow({ videoId: "video_1" }),
    );

    const response = await PUT(attachRequest(), routeParams);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Recording is only for a page feedback",
    });
    expect(putObjectDouble).not.toHaveBeenCalled();
  });

  it("rejects a body that is not readable as form data", async () => {
    const response = await PUT(
      attachRequest("not-a-multipart-body", {
        headers: { "content-type": "multipart/form-data; boundary=broken" },
      }),
      routeParams,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid form data",
    });
  });

  it("rejects a form with no recording file", async () => {
    const response = await PUT(
      attachRequest(recordingForm({ file: null })),
      routeParams,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Missing recording file",
    });
  });

  it("rejects a recording above the 4MB limit", async () => {
    const response = await PUT(
      attachRequest(
        recordingForm({ file: recordingFile(4 * 1024 * 1024 + 1) }),
      ),
      routeParams,
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      error: "Recording exceeds 4MB limit",
    });
    expect(putObjectDouble).not.toHaveBeenCalled();
  });

  it.each([
    ["a duration above the cap", { durationMs: "65001" }],
    ["a negative duration", { durationMs: "-1" }],
    ["a duration that is not a whole number", { durationMs: "1.5" }],
    ["a missing duration", { durationMs: null }],
    ["an unknown format version", { formatVersion: "2" }],
    ["a missing format version", { formatVersion: null }],
  ])("rejects %s", async (_case, fields) => {
    const response = await PUT(
      attachRequest(recordingForm(fields)),
      routeParams,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid recording duration or format version",
    });
    expect(putObjectDouble).not.toHaveBeenCalled();
  });
});
