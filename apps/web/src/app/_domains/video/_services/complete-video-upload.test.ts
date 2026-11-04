import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PreconditionFailedError,
} from "@/server/errors/domain-errors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const storedObjects = new Map<string, number>();
const headStorageObject = vi.fn(({ key }: { key: string }) => {
  const size = storedObjects.get(key);
  return Promise.resolve(
    size === undefined ? null : { size, contentType: "video/mp4" },
  );
});
const deleteStorageObjects = vi.fn((keys: string[]) => {
  for (const key of keys) storedObjects.delete(key);
  return Promise.resolve({ errors: [] });
});

vi.mock("@/server/storage/objects", () => ({
  headStorageObject,
  deleteStorageObjects,
}));

const { completeVideoUpload } = await import("./complete-video-upload");

type FakeDb = NonNullable<Parameters<typeof completeVideoUpload>[1]>;

const MB = 1_000_000;
const SOURCE_KEY = "videos/project_1/video_1/source.mp4";
const POSTER_KEY = "videos/project_1/video_1/poster.jpg";

type VideoRow = {
  id: string;
  projectId: string;
  organizationId: string;
  state: string;
  size: bigint;
  filename: string;
  mimeType: string;
  width: number;
  height: number;
  fileAsset?: Record<string, unknown>;
  posterAsset?: Record<string, unknown>;
};

function videoRow(overrides: Partial<VideoRow> = {}): VideoRow {
  return {
    id: "video_1",
    projectId: "project_1",
    organizationId: "org_1",
    state: "uploading",
    size: BigInt(100 * MB),
    filename: "cut.mp4",
    mimeType: "video/mp4",
    width: 1920,
    height: 1080,
    ...overrides,
  };
}

type VideoWhere = { project: { organizationId: string }; id?: { not: string } };

// Applies the writes in memory, so a case asserts the rows it ends up holding.
function fakeDb({
  videos = [videoRow()],
  membership = { id: "member_1" },
}: {
  videos?: VideoRow[];
  membership?: { id: string } | null;
} = {}) {
  const rows = new Map(videos.map((video) => [video.id, { ...video }]));
  const inOrganization = (where: VideoWhere) =>
    [...rows.values()].filter(
      (video) =>
        video.organizationId === where.project.organizationId &&
        video.id !== where.id?.not,
    );

  const db = {
    rows,
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    subscription: { findFirst: vi.fn().mockResolvedValue(null) },
    video: {
      findUnique: vi.fn(({ where }: { where: { id: string } }) => {
        const video = rows.get(where.id);
        return Promise.resolve(
          video && {
            ...video,
            project: { organizationId: video.organizationId },
          },
        );
      }),
      count: vi.fn(({ where }: { where: VideoWhere }) =>
        Promise.resolve(inOrganization(where).length),
      ),
      aggregate: vi.fn(({ where }: { where: VideoWhere }) => {
        const matching = inOrganization(where);
        return Promise.resolve({
          _sum: {
            size: matching.length
              ? matching.reduce((sum, video) => sum + video.size, 0n)
              : null,
          },
        });
      }),
      update: vi.fn(
        ({
          where,
          data: { fileAsset, posterAsset, ...data },
        }: {
          where: { id: string };
          data: {
            state: string;
            size: bigint;
            fileAsset: { create: Record<string, unknown> };
            posterAsset?: { create: Record<string, unknown> };
          };
        }) => {
          const video = rows.get(where.id);
          if (!video) throw new NotFoundError("Record to update not found.");
          Object.assign(video, data, {
            fileAsset: fileAsset.create,
            posterAsset: posterAsset?.create,
          });
          return Promise.resolve({
            id: video.id,
            state: video.state,
            size: video.size,
          });
        },
      ),
      delete: vi.fn(({ where }: { where: { id: string } }) => {
        rows.delete(where.id);
        return Promise.resolve({ id: where.id });
      }),
    },
  };
  return db as typeof db & FakeDb;
}

const input = { videoId: "video_1", userId: "user_1" };

describe("completeVideoUpload", () => {
  beforeEach(() => {
    storedObjects.clear();
    headStorageObject.mockClear();
    deleteStorageObjects.mockClear();
    vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "true");
    vi.stubEnv("STORAGE_PROVIDER", "local");
    vi.stubEnv("STORAGE_BUCKET_NAME", "uploads");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("records the size storage reports and flips the Video to ready", async () => {
    storedObjects.set(SOURCE_KEY, 120 * MB);
    const db = fakeDb();

    await expect(completeVideoUpload(input, db)).resolves.toEqual({
      id: "video_1",
      state: "ready",
      size: BigInt(120 * MB),
    });
    expect(db.rows.get("video_1")).toMatchObject({
      state: "ready",
      size: BigInt(120 * MB),
    });
  });

  it("creates the file Asset at the source key with the real size", async () => {
    storedObjects.set(SOURCE_KEY, 120 * MB);
    const db = fakeDb();

    await completeVideoUpload(input, db);

    expect(db.rows.get("video_1")?.fileAsset).toEqual({
      key: SOURCE_KEY,
      bucket: "uploads",
      provider: "local",
      filename: "cut.mp4",
      mimeType: "video/mp4",
      size: BigInt(120 * MB),
      width: 1920,
      height: 1080,
      uploadedById: "user_1",
    });
    expect(db.rows.get("video_1")?.posterAsset).toBeUndefined();
  });

  it("creates the Poster Asset when a Poster was uploaded", async () => {
    storedObjects.set(SOURCE_KEY, 120 * MB);
    storedObjects.set(POSTER_KEY, 80_000);
    const db = fakeDb();

    await completeVideoUpload({ ...input, posterKey: POSTER_KEY }, db);

    expect(db.rows.get("video_1")?.posterAsset).toMatchObject({
      key: POSTER_KEY,
      mimeType: "image/jpeg",
      size: 80_000n,
    });
  });

  it("commits the Video without a Poster when the Poster never landed", async () => {
    storedObjects.set(SOURCE_KEY, 120 * MB);
    const db = fakeDb();

    await completeVideoUpload({ ...input, posterKey: POSTER_KEY }, db);

    expect(db.rows.get("video_1")).toMatchObject({ state: "ready" });
    expect(db.rows.get("video_1")?.posterAsset).toBeUndefined();
  });

  it("commits the Video without a Poster when reading the Poster fails", async () => {
    storedObjects.set(SOURCE_KEY, 120 * MB);
    const db = fakeDb();
    headStorageObject.mockImplementationOnce(() =>
      Promise.resolve({ size: 120 * MB, contentType: "video/mp4" }),
    );
    headStorageObject.mockImplementationOnce(() =>
      Promise.reject(new Error("timeout")),
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await completeVideoUpload({ ...input, posterKey: POSTER_KEY }, db);

    expect(db.rows.get("video_1")).toMatchObject({ state: "ready" });
    expect(db.rows.get("video_1")?.posterAsset).toBeUndefined();
  });

  it("deletes the objects and the row when the real size is over the cap", async () => {
    storedObjects.set(SOURCE_KEY, 600 * MB);
    storedObjects.set(POSTER_KEY, 80_000);
    const db = fakeDb();

    await expect(
      completeVideoUpload({ ...input, posterKey: POSTER_KEY }, db),
    ).rejects.toThrow(
      new ForbiddenError(
        JSON.stringify({
          kind: "videoFileSize",
          size: 600 * MB,
          cap: 500 * MB,
        }),
      ),
    );
    expect(db.rows.has("video_1")).toBe(false);
    expect(storedObjects.size).toBe(0);
  });

  it("refuses a real size that breaks the budget even when the declared one fitted", async () => {
    const GB = 1_000_000_000;
    storedObjects.set(SOURCE_KEY, 2 * GB);
    const db = fakeDb({
      videos: [
        videoRow({ size: BigInt(10 * MB) }),
        videoRow({ id: "video_2", state: "ready", size: BigInt(19 * GB) }),
      ],
    });
    db.subscription.findFirst.mockResolvedValue({
      plan: "pro",
      status: "active",
    });

    await expect(completeVideoUpload(input, db)).rejects.toThrow(
      new ForbiddenError(
        JSON.stringify({
          kind: "videoStorage",
          used: 19 * GB,
          budget: 20 * GB,
        }),
      ),
    );
    expect(db.rows.has("video_1")).toBe(false);
    expect(db.rows.has("video_2")).toBe(true);
    expect(storedObjects.has(SOURCE_KEY)).toBe(false);
  });

  it("does not count the Video's own declared size against the budget", async () => {
    storedObjects.set(SOURCE_KEY, 450 * MB);
    const db = fakeDb({ videos: [videoRow({ size: BigInt(450 * MB) })] });

    await expect(completeVideoUpload(input, db)).resolves.toMatchObject({
      state: "ready",
      size: BigInt(450 * MB),
    });
  });

  it("leaves the row in uploading when the object is missing", async () => {
    const db = fakeDb();

    await expect(completeVideoUpload(input, db)).rejects.toThrow(
      PreconditionFailedError,
    );
    expect(db.rows.get("video_1")).toMatchObject({
      state: "uploading",
      size: BigInt(100 * MB),
    });
  });

  it("refuses a Poster key outside the Video's folder", async () => {
    storedObjects.set(SOURCE_KEY, 120 * MB);
    const db = fakeDb();

    await expect(
      completeVideoUpload(
        { ...input, posterKey: "videos/project_1/video_2/poster.jpg" },
        db,
      ),
    ).rejects.toThrow(BadRequestError);
    expect(db.rows.get("video_1")).toMatchObject({ state: "uploading" });
  });

  it("refuses a caller who is not a Member of the Video's Organization", async () => {
    storedObjects.set(SOURCE_KEY, 120 * MB);
    const db = fakeDb({ membership: null });

    await expect(completeVideoUpload(input, db)).rejects.toThrow(
      ForbiddenError,
    );
    expect(db.rows.get("video_1")).toMatchObject({ state: "uploading" });
  });

  it("reports an unknown Video as not found", async () => {
    await expect(
      completeVideoUpload({ ...input, videoId: "video_9" }, fakeDb()),
    ).rejects.toThrow(NotFoundError);
  });

  it("refuses to commit a Video twice", async () => {
    storedObjects.set(SOURCE_KEY, 120 * MB);
    const db = fakeDb({ videos: [videoRow({ state: "ready" })] });

    await expect(completeVideoUpload(input, db)).rejects.toThrow(ConflictError);
  });
});
