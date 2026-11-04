import { beforeEach, describe, expect, it, vi } from "vitest";

const storedObjects = new Set<string>();
const deleteStorageObjects = vi.fn((keys: string[]) => {
  for (const key of keys) storedObjects.delete(key);
  return Promise.resolve({ errors: [] });
});

vi.mock("@/server/storage/objects", () => ({ deleteStorageObjects }));

const { deleteAbandonedVideoUploads } =
  await import("./delete-abandoned-video-uploads");

type FakeDb = NonNullable<Parameters<typeof deleteAbandonedVideoUploads>[1]>;

const NOW = new Date("2026-11-04T12:00:00Z");
const HOUR = 60 * 60 * 1000;

type VideoRow = {
  id: string;
  projectId: string;
  mimeType: string;
  state: string;
  createdAt: Date;
};

function videoRow(id: string, overrides: Partial<VideoRow> = {}): VideoRow {
  return {
    id,
    projectId: "project_1",
    mimeType: "video/mp4",
    state: "uploading",
    createdAt: new Date(NOW.getTime() - 25 * HOUR),
    ...overrides,
  };
}

function storeObjectsOf(video: VideoRow) {
  const extension = video.mimeType === "video/quicktime" ? "mov" : "mp4";
  storedObjects.add(
    `videos/${video.projectId}/${video.id}/source.${extension}`,
  );
  storedObjects.add(`videos/${video.projectId}/${video.id}/poster.jpg`);
}

type VideoWhere = {
  state?: string;
  createdAt?: { lte: Date };
  id?: { in: string[] };
};

// Applies the writes in memory, so a case asserts the rows it ends up holding.
function fakeDb(videos: VideoRow[]) {
  const rows = new Map(videos.map((video) => [video.id, video]));
  const matches = (where: VideoWhere) =>
    [...rows.values()].filter(
      (video) =>
        (where.state === undefined || video.state === where.state) &&
        (where.createdAt === undefined ||
          video.createdAt <= where.createdAt.lte) &&
        (where.id === undefined || where.id.in.includes(video.id)),
    );

  const db = {
    rows,
    video: {
      findMany: vi.fn(({ where }: { where: VideoWhere }) =>
        Promise.resolve(matches(where)),
      ),
      deleteMany: vi.fn(({ where }: { where: VideoWhere }) => {
        const matching = matches(where);
        for (const video of matching) rows.delete(video.id);
        return Promise.resolve({ count: matching.length });
      }),
    },
  };

  return db as typeof db & FakeDb;
}

describe("deleteAbandonedVideoUploads", () => {
  beforeEach(() => {
    storedObjects.clear();
    vi.clearAllMocks();
  });

  it("removes an `uploading` Video older than 24 hours with its source and Poster objects", async () => {
    const abandoned = videoRow("video_old", { mimeType: "video/quicktime" });
    storeObjectsOf(abandoned);
    const db = fakeDb([abandoned]);

    const result = await deleteAbandonedVideoUploads(NOW, db);

    expect(result).toEqual({ deleted: 1 });
    expect(db.rows.size).toBe(0);
    expect(storedObjects.size).toBe(0);
  });

  it("leaves a younger `uploading` Video and a `ready` Video alone", async () => {
    const young = videoRow("video_young", {
      createdAt: new Date(NOW.getTime() - 23 * HOUR),
    });
    const ready = videoRow("video_ready", { state: "ready" });
    storeObjectsOf(young);
    storeObjectsOf(ready);
    const db = fakeDb([young, ready]);

    const result = await deleteAbandonedVideoUploads(NOW, db);

    expect(result).toEqual({ deleted: 0 });
    expect([...db.rows.keys()]).toEqual(["video_young", "video_ready"]);
    expect(storedObjects.size).toBe(4);
  });

  it("removes only the abandoned Video among others", async () => {
    const abandoned = videoRow("video_old");
    const young = videoRow("video_young", {
      createdAt: new Date(NOW.getTime() - HOUR),
    });
    storeObjectsOf(abandoned);
    storeObjectsOf(young);
    const db = fakeDb([abandoned, young]);

    await deleteAbandonedVideoUploads(NOW, db);

    expect([...db.rows.keys()]).toEqual(["video_young"]);
    expect([...storedObjects]).toEqual([
      "videos/project_1/video_young/source.mp4",
      "videos/project_1/video_young/poster.jpg",
    ]);
  });

  it("still removes the row when storage refuses the delete", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    deleteStorageObjects.mockRejectedValueOnce(new Error("storage down"));
    const abandoned = videoRow("video_old");
    storeObjectsOf(abandoned);
    const db = fakeDb([abandoned]);

    const result = await deleteAbandonedVideoUploads(NOW, db);

    expect(result).toEqual({ deleted: 1 });
    expect(db.rows.size).toBe(0);
    expect(storedObjects.size).toBe(2);
  });

  it("keeps the objects of a Video committed between the read and the delete", async () => {
    const abandoned = videoRow("video_old");
    storeObjectsOf(abandoned);
    const db = fakeDb([abandoned]);
    db.video.findMany.mockImplementationOnce(({ where }) => {
      const found = [...db.rows.values()].filter((video) =>
        where.createdAt ? video.createdAt <= where.createdAt.lte : true,
      );
      // The commit lands right after the reaper read the row.
      db.rows.set("video_old", { ...abandoned, state: "ready" });
      return Promise.resolve(found);
    });

    const result = await deleteAbandonedVideoUploads(NOW, db);

    expect(result).toEqual({ deleted: 0 });
    expect(db.rows.get("video_old")?.state).toBe("ready");
    expect(storedObjects.size).toBe(2);
  });

  it("does nothing when no upload is abandoned", async () => {
    const db = fakeDb([]);

    const result = await deleteAbandonedVideoUploads(NOW, db);

    expect(result).toEqual({ deleted: 0 });
    expect(deleteStorageObjects).not.toHaveBeenCalled();
  });
});
