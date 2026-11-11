import realRecording from "@/app/_domains/feedback/_helpers/read-recording-steps.real-recording.json";
import { RECORDING_STEPS_VERSION } from "@/app/_domains/feedback/_helpers/read-recording-steps";
import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { gzipSync } from "node:zlib";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getRecordingPlayback } from "./get-recording-playback";

const { getStorageObjectDouble } = vi.hoisted(() => ({
  getStorageObjectDouble: vi.fn(),
}));
vi.mock("@/server/storage/objects", () => ({
  getStorageObject: getStorageObjectDouble,
}));
vi.mock("@/server/storage/get-signed-asset-url", () => ({
  getSignedAssetUrl: vi.fn(),
}));

type FakeDb = NonNullable<Parameters<typeof getRecordingPlayback>[1]>;

const FEEDBACK_ID = "feedback_1";
const USER_ID = "user_1";
const CREATED_AT = new Date("2026-11-04T09:12:33.000Z");

const timestamps = realRecording.map(({ timestamp }) => timestamp);
const startedAt = Math.min(...timestamps);
const endedAt = Math.max(...timestamps);

const diagnosticTrail = {
  console: [
    { level: "error", message: "Save failed", timestamp: endedAt - 500 },
    { level: "log", message: "Typing", timestamp: endedAt + 2_000 },
  ],
  network: [
    {
      method: "POST",
      url: "/api/save",
      status: 500,
      duration: 80,
      timestamp: endedAt - 600,
    },
  ],
};

function feedbackRow(overrides: Record<string, unknown> = {}) {
  return {
    id: FEEDBACK_ID,
    selector: "#save",
    metadata: { elementDescription: 'button "Save"' },
    diagnosticTrail,
    createdAt: CREATED_AT,
    recording: { key: "recordings/feedback.json.gz" },
    recordingDurationMs: endedAt - startedAt,
    recordingFormatVersion: 1,
    recordingSteps: null,
    recordingStepsVersion: null,
    project: { organizationId: "organization_1" },
    ...overrides,
  };
}

/** One Feedback row whose cache columns follow the service's writes. */
function fakeDb({
  row = feedbackRow() as Record<string, unknown> | null,
  membership = { id: "member_1" } as { id: string } | null,
} = {}) {
  const db = {
    feedback: {
      findUnique: vi.fn(async () => (row ? { ...row } : null)),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        row = { ...row, ...data };
        return { id: FEEDBACK_ID };
      }),
    },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
  };
  return { db: db as unknown as FakeDb, row: () => row };
}

const input = { feedbackId: FEEDBACK_ID, userId: USER_ID };

beforeEach(() => {
  vi.clearAllMocks();
  getStorageObjectDouble.mockResolvedValue(
    gzipSync(JSON.stringify(realRecording)),
  );
});

describe("getRecordingPlayback", () => {
  it("gives a Member the merged entries, the duration, the clock bounds and the readable flag", async () => {
    const { db } = fakeDb();

    const playback = await getRecordingPlayback(input, db);

    expect(playback).toMatchObject({
      readable: true,
      durationMs: endedAt - startedAt,
      startedAt,
      endedAt,
    });
    const kinds = playback.entries.map((entry) => entry.kind);
    expect(kinds).toContain("network");
    expect(kinds).toContain("console");
    expect(playback.entries.at(-1)).toMatchObject({
      kind: "step",
      offsetMs: 0,
      step: { type: "selection", label: 'button "Save"', selector: "#save" },
    });
    const times = playback.entries.map((entry) => entry.timestamp);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    // The network entry sits at the start of its request.
    expect(
      playback.entries.find((entry) => entry.kind === "network")?.timestamp,
    ).toBe(endedAt - 600);
  });

  it("does not cap the entries", async () => {
    const many = Array.from({ length: 300 }, (_, index) => ({
      level: "log",
      message: `log ${index}`,
      timestamp: startedAt + index,
    }));
    const { db } = fakeDb({
      row: feedbackRow({ diagnosticTrail: { console: many, network: [] } }),
    });

    const playback = await getRecordingPlayback(input, db);

    expect(
      playback.entries.filter((entry) => entry.kind === "console"),
    ).toHaveLength(300);
  });

  it("caches the steps on the first call and reads the cache, not storage, on the second", async () => {
    const { db, row } = fakeDb();

    const first = await getRecordingPlayback(input, db);
    expect(row()).toMatchObject({
      recordingStepsVersion: RECORDING_STEPS_VERSION,
    });
    const second = await getRecordingPlayback(input, db);

    expect(getStorageObjectDouble).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it("answers an unreadable file with the Diagnostic Trail's entries and the readable flag off", async () => {
    getStorageObjectDouble.mockResolvedValue(Buffer.from("not gzip"));
    const { db } = fakeDb();

    const playback = await getRecordingPlayback(input, db);

    expect(playback).toMatchObject({
      readable: false,
      durationMs: endedAt - startedAt,
      startedAt: null,
      endedAt: null,
    });
    expect(
      playback.entries.map((entry) => [entry.kind, entry.timestamp]),
    ).toEqual([
      ["network", endedAt - 600],
      ["console", endedAt - 500],
      ["console", endedAt + 2_000],
    ]);
    expect(playback.entries[0]?.offsetMs).toBe(
      endedAt - 600 - CREATED_AT.getTime(),
    );
  });

  it("refuses a Feedback without a Recording", async () => {
    const { db } = fakeDb({
      row: feedbackRow({
        recording: null,
        recordingDurationMs: null,
        recordingFormatVersion: null,
      }),
    });

    await expect(getRecordingPlayback(input, db)).rejects.toThrow(
      new NotFoundError("Recording not found."),
    );
    expect(getStorageObjectDouble).not.toHaveBeenCalled();
  });

  it("refuses a user who is not a Member of the Feedback's Organization", async () => {
    const { db } = fakeDb({ membership: null });

    await expect(getRecordingPlayback(input, db)).rejects.toThrow(
      new ForbiddenError("Access denied."),
    );
    expect(getStorageObjectDouble).not.toHaveBeenCalled();
  });

  it("reports a Feedback that does not exist as not found", async () => {
    const { db } = fakeDb({ row: null });

    await expect(getRecordingPlayback(input, db)).rejects.toThrow(
      new NotFoundError("Feedback not found."),
    );
  });
});
