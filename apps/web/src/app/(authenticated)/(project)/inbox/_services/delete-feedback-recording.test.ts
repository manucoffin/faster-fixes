import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { deleteStorageObject } from "@/server/storage/objects";
import { Prisma } from "@workspace/db/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteFeedbackRecording } from "./delete-feedback-recording";

vi.mock("@/server/storage/objects", () => ({
  deleteStorageObject: vi.fn(),
}));

type FakeDb = NonNullable<Parameters<typeof deleteFeedbackRecording>[1]>;

type FakeFeedback = {
  id: string;
  status: string;
  comment: string;
  screenshotId: string | null;
  diagnosticTrail: unknown;
  recordingId: string | null;
  recordingDurationMs: number | null;
  recordingFormatVersion: number | null;
  recordingSteps: unknown;
  recordingStepsVersion: number | null;
  project: { organizationId: string };
};

type FakeAsset = { id: string; key: string };

// Holds rows and applies the writes the service makes, so a test asserts the
// rows it ends up with rather than the calls that produced them.
function fakeDb({
  feedback,
  assets,
  membership,
}: {
  feedback: FakeFeedback | null;
  assets: FakeAsset[];
  membership: { id: string } | null;
}) {
  const rows = { feedback, assets: [...assets] };
  const db = {
    feedback: {
      findUnique: vi.fn(async () => rows.feedback),
      update: vi.fn(async ({ data }: { data: Partial<FakeFeedback> }) => {
        rows.feedback = { ...rows.feedback!, ...data };
        return { id: rows.feedback.id };
      }),
    },
    asset: {
      findUnique: vi.fn(
        async ({ where }: { where: { id: string } }) =>
          rows.assets.find((asset) => asset.id === where.id) ?? null,
      ),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        rows.assets = rows.assets.filter((asset) => asset.id !== where.id);
      }),
    },
    member: { findFirst: vi.fn(async () => membership) },
  };
  return { db: db as unknown as FakeDb, rows };
}

const withRecording: FakeFeedback = {
  id: "feedback_1",
  status: "new",
  comment: "The menu closes too early",
  screenshotId: "screenshot_1",
  diagnosticTrail: { console: [], network: [] },
  recordingId: "recording_1",
  recordingDurationMs: 12_000,
  recordingFormatVersion: 1,
  recordingSteps: { startedAt: 0, endedAt: 12_000, steps: [] },
  recordingStepsVersion: 3,
  project: { organizationId: "org_1" },
};

const assets: FakeAsset[] = [
  { id: "screenshot_1", key: "screenshots/1.png" },
  { id: "recording_1", key: "recordings/1.json.gz" },
];

const member = { id: "member_1" };
const input = { feedbackId: "feedback_1", userId: "user_1" };

describe("deleteFeedbackRecording", () => {
  beforeEach(() => {
    vi.mocked(deleteStorageObject).mockReset();
    vi.mocked(deleteStorageObject).mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("frees the Recording and clears it from the Feedback, leaving the rest as it was", async () => {
    const { db, rows } = fakeDb({
      feedback: withRecording,
      assets,
      membership: member,
    });

    await expect(deleteFeedbackRecording(input, db)).resolves.toEqual({
      id: "feedback_1",
    });

    expect(deleteStorageObject).toHaveBeenCalledWith({
      id: "recording_1",
      key: "recordings/1.json.gz",
    });
    expect(rows.assets).toEqual([
      { id: "screenshot_1", key: "screenshots/1.png" },
    ]);
    expect(rows.feedback).toEqual({
      ...withRecording,
      recordingId: null,
      recordingDurationMs: null,
      recordingFormatVersion: null,
      recordingSteps: Prisma.DbNull,
      recordingStepsVersion: null,
    });
  });

  it("works on a closed Feedback", async () => {
    const { db, rows } = fakeDb({
      feedback: { ...withRecording, status: "closed" },
      assets,
      membership: member,
    });

    await deleteFeedbackRecording(input, db);

    expect(rows.feedback?.recordingId).toBeNull();
    expect(rows.feedback?.status).toBe("closed");
  });

  it("still removes the Recording when storage fails", async () => {
    vi.mocked(deleteStorageObject).mockRejectedValue(new Error("S3 down"));
    const { db, rows } = fakeDb({
      feedback: withRecording,
      assets,
      membership: member,
    });

    await expect(deleteFeedbackRecording(input, db)).resolves.toEqual({
      id: "feedback_1",
    });

    expect(rows.feedback?.recordingId).toBeNull();
    expect(rows.assets.map((asset) => asset.id)).toEqual(["screenshot_1"]);
  });

  it("refuses a caller who is not a Member of the Feedback's Organization", async () => {
    const { db, rows } = fakeDb({
      feedback: withRecording,
      assets,
      membership: null,
    });

    await expect(deleteFeedbackRecording(input, db)).rejects.toThrow(
      new ForbiddenError("Access denied."),
    );
    expect(rows.feedback).toEqual(withRecording);
    expect(rows.assets).toEqual(assets);
    expect(deleteStorageObject).not.toHaveBeenCalled();
  });

  it("refuses a Feedback without a Recording", async () => {
    const withoutRecording = {
      ...withRecording,
      recordingId: null,
      recordingDurationMs: null,
      recordingFormatVersion: null,
      recordingSteps: null,
      recordingStepsVersion: null,
    };
    const { db, rows } = fakeDb({
      feedback: withoutRecording,
      assets,
      membership: member,
    });

    await expect(deleteFeedbackRecording(input, db)).rejects.toThrow(
      new NotFoundError("Recording not found."),
    );
    expect(rows.feedback).toEqual(withoutRecording);
    expect(rows.assets).toEqual(assets);
  });

  it("reports an unknown Feedback as not found", async () => {
    const { db } = fakeDb({ feedback: null, assets, membership: member });

    await expect(deleteFeedbackRecording(input, db)).rejects.toThrow(
      new NotFoundError("Feedback not found."),
    );
  });
});
