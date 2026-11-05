import { generateShareLinkSecret } from "@/app/_domains/video/_helpers/share-link-secret";
import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/storage/get-signed-asset-url", () => ({
  getSignedAssetUrl: ({ key }: { key: string }) =>
    Promise.resolve(`https://storage.test/${key}?signed`),
}));

const { listVideos } = await import("./list-videos");

type FakeDb = NonNullable<Parameters<typeof listVideos>[1]>;

type VideoRow = {
  id: string;
  projectId: string;
  title: string;
  state: string;
  durationMs: number | null;
  size: bigint;
  annotationsOpen: boolean;
  createdAt: Date;
  shareTokenEncrypted: string;
  posterAsset: { key: string } | null;
  uploadedBy: { name: string } | null;
  feedbackStatuses: string[];
};

type FindManyArgs = {
  where: { projectId: string };
  select: {
    _count: {
      select: { feedback: { where: { status: { in: string[] } } } };
    };
  };
};

type GroupByArgs = {
  where: { videoId: { in: string[] } };
};

// Reads the Status filter the service asks the count for, so a case asserts
// which Feedback ends up counted rather than the shape of the query.
function fakeDb({
  videos = [] as VideoRow[],
  project = { organizationId: "org_1" } as { organizationId: string } | null,
  membership = { id: "member_1" } as { id: string } | null,
} = {}) {
  const db = {
    project: { findUnique: vi.fn().mockResolvedValue(project) },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    feedback: {
      groupBy: vi.fn(({ where }: GroupByArgs) =>
        Promise.resolve(
          videos
            .filter((video) => where.videoId.in.includes(video.id))
            .map((video) => ({
              videoId: video.id,
              _count: { _all: video.feedbackStatuses.length },
            }))
            .filter(({ _count }) => _count._all > 0),
        ),
      ),
    },
    video: {
      findMany: vi.fn(({ where, select }: FindManyArgs) => {
        const openStatuses = select._count.select.feedback.where.status.in;
        return Promise.resolve(
          videos
            .filter((video) => video.projectId === where.projectId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map(({ feedbackStatuses, ...video }) => ({
              ...video,
              _count: {
                feedback: feedbackStatuses.filter((status) =>
                  openStatuses.includes(status),
                ).length,
              },
            })),
        );
      }),
    },
  };
  return db as unknown as FakeDb;
}

function videoRow(overrides: Partial<VideoRow> = {}): VideoRow {
  return {
    id: "video_1",
    projectId: "project_1",
    title: "Launch cut",
    state: "ready",
    durationMs: 92_000,
    size: 48_000_000n,
    annotationsOpen: true,
    createdAt: new Date("2026-10-01T10:00:00Z"),
    shareTokenEncrypted: generateShareLinkSecret().encrypted,
    posterAsset: { key: "videos/video_1/poster.jpg" },
    uploadedBy: { name: "Ada" },
    feedbackStatuses: [],
    ...overrides,
  };
}

const input = { projectId: "project_1", userId: "user_1" };

describe("listVideos", () => {
  beforeEach(() => {
    vi.stubEnv("BETTER_AUTH_SECRET", "test-auth-secret");
    vi.stubEnv("BASE_URL", "https://app.test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a row with its signed Poster, uploader and decrypted Share link", async () => {
    const shareLink = generateShareLinkSecret();
    const db = fakeDb({
      videos: [videoRow({ shareTokenEncrypted: shareLink.encrypted })],
    });

    await expect(listVideos(input, db)).resolves.toEqual([
      {
        id: "video_1",
        title: "Launch cut",
        state: "ready",
        durationMs: 92_000,
        size: 48_000_000,
        posterUrl: "https://storage.test/videos/video_1/poster.jpg?signed",
        openFeedbackCount: 0,
        feedbackCount: 0,
        annotationsOpen: true,
        uploadedBy: "Ada",
        createdAt: new Date("2026-10-01T10:00:00Z"),
        shareUrl: `https://app.test/review/${shareLink.secret}`,
      },
    ]);
  });

  it("counts new and in progress Feedback only as open", async () => {
    const db = fakeDb({
      videos: [
        videoRow({
          feedbackStatuses: ["new", "in_progress", "new", "resolved", "closed"],
        }),
      ],
    });

    const [row] = await listVideos(input, db);
    expect(row?.openFeedbackCount).toBe(3);
  });

  it("counts every Feedback of the Video, whatever its Status", async () => {
    const db = fakeDb({
      videos: [
        videoRow({
          id: "commented",
          feedbackStatuses: ["new", "in_progress", "resolved", "closed"],
        }),
        videoRow({ id: "silent", feedbackStatuses: [] }),
      ],
    });

    const rows = await listVideos(input, db);
    expect(
      rows.map(({ id, feedbackCount }) => ({ id, feedbackCount })),
    ).toEqual([
      { id: "commented", feedbackCount: 4 },
      { id: "silent", feedbackCount: 0 },
    ]);
  });

  it("carries an uploading Video with its state, no Poster and no uploader", async () => {
    const db = fakeDb({
      videos: [
        videoRow({
          state: "uploading",
          durationMs: null,
          posterAsset: null,
          uploadedBy: null,
        }),
      ],
    });

    const [row] = await listVideos(input, db);
    expect(row).toMatchObject({
      state: "uploading",
      durationMs: null,
      posterUrl: null,
      uploadedBy: null,
    });
  });

  it("orders the rows newest first", async () => {
    const db = fakeDb({
      videos: [
        videoRow({ id: "old", createdAt: new Date("2026-09-01T00:00:00Z") }),
        videoRow({ id: "new", createdAt: new Date("2026-10-15T00:00:00Z") }),
        videoRow({ id: "mid", createdAt: new Date("2026-10-01T00:00:00Z") }),
      ],
    });

    const rows = await listVideos(input, db);
    expect(rows.map((row) => row.id)).toEqual(["new", "mid", "old"]);
  });

  it("shows no Share link when the stored secret no longer decrypts", async () => {
    const db = fakeDb({
      videos: [videoRow({ shareTokenEncrypted: "not:a:cipher" })],
    });

    const [row] = await listVideos(input, db);
    expect(row?.shareUrl).toBeNull();
  });

  it("refuses a caller who is not a Member of the organization", async () => {
    const db = fakeDb({ videos: [videoRow()], membership: null });

    await expect(listVideos(input, db)).rejects.toThrow(
      new ForbiddenError("You are not a member of this project."),
    );
  });

  it("reports an unknown Project as not found", async () => {
    const db = fakeDb({ project: null });

    await expect(listVideos(input, db)).rejects.toThrow(
      new NotFoundError("Project not found."),
    );
  });
});
