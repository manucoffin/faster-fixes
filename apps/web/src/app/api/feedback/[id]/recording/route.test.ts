import { beforeEach, describe, expect, it, vi } from "vitest";

const FEEDBACK_ID = "feedback_1";
const RECORDING_KEY = "feedback-recordings/project_1/recording.gz";
const GZIP_BYTES = Buffer.from([0x1f, 0x8b, 0x08, 0x00, 0x01, 0x02, 0x03]);

const recordingPrisma = {
  feedback: { findUnique: vi.fn() },
  member: { findFirst: vi.fn() },
};
const getSessionDouble = vi.fn();
const getStorageObjectDouble = vi.fn();

vi.mock("@workspace/db", () => ({ prisma: recordingPrisma }));
vi.mock("@/server/auth", () => ({
  auth: { api: { getSession: getSessionDouble } },
}));
vi.mock("@/server/storage/objects", () => ({
  getStorageObject: getStorageObjectDouble,
}));

const { GET } = await import("./route");

function getRecording() {
  return GET(
    new Request(`https://app.test/api/feedback/${FEEDBACK_ID}/recording`),
    { params: Promise.resolve({ id: FEEDBACK_ID }) },
  );
}

function storedFeedback(recording: { key: string } | null) {
  recordingPrisma.feedback.findUnique.mockResolvedValue({
    recording,
    project: { organizationId: "org_1" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionDouble.mockResolvedValue({ user: { id: "user_1" } });
  recordingPrisma.member.findFirst.mockResolvedValue({ id: "member_1" });
  storedFeedback({ key: RECORDING_KEY });
  getStorageObjectDouble.mockResolvedValue(GZIP_BYTES);
});

describe("GET /api/feedback/:id/recording", () => {
  it("serves a Member the stored bytes unchanged, as an opaque gzip file", async () => {
    const response = await getRecording();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/gzip");
    expect(response.headers.get("content-encoding")).toBeNull();
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(GZIP_BYTES);
    expect(getStorageObjectDouble).toHaveBeenCalledWith({ key: RECORDING_KEY });
  });

  it("answers with a private policy no shared cache stores", async () => {
    const response = await getRecording();

    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("refuses a signed-out caller", async () => {
    getSessionDouble.mockResolvedValue(null);

    const response = await getRecording();

    expect(response.status).toBe(401);
    expect(getStorageObjectDouble).not.toHaveBeenCalled();
  });

  it("refuses a User who is not a Member of the Feedback's Organization", async () => {
    recordingPrisma.member.findFirst.mockResolvedValue(null);

    const response = await getRecording();

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Access denied.",
      code: "FORBIDDEN",
    });
    expect(getStorageObjectDouble).not.toHaveBeenCalled();
  });

  it("refuses a non-Member the same way whether or not the Feedback has a Recording", async () => {
    recordingPrisma.member.findFirst.mockResolvedValue(null);
    storedFeedback(null);

    expect((await getRecording()).status).toBe(403);
  });

  it("answers not found for a Feedback that does not exist", async () => {
    recordingPrisma.feedback.findUnique.mockResolvedValue(null);

    const response = await getRecording();

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Feedback not found.",
      code: "NOT_FOUND",
    });
  });

  it("answers not found for a Feedback without a Recording", async () => {
    storedFeedback(null);

    const response = await getRecording();

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Recording not found.",
      code: "NOT_FOUND",
    });
    expect(getStorageObjectDouble).not.toHaveBeenCalled();
  });

  it("answers not found when the storage object is missing", async () => {
    getStorageObjectDouble.mockResolvedValue(null);

    const response = await getRecording();

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Recording not found.",
      code: "NOT_FOUND",
    });
  });
});
