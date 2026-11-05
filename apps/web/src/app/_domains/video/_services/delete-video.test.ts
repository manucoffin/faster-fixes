import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteAssets = vi.fn();

vi.mock("@/server/storage/delete-assets", () => ({ deleteAssets }));

const { deleteVideo } = await import("./delete-video");

type FakeDb = NonNullable<Parameters<typeof deleteVideo>[1]>;

type VideoRow = {
  id: string;
  fileAssetId: string | null;
  posterAssetId: string | null;
  project: { organizationId: string };
};

type FeedbackRow = { videoId: string; screenshotId: string | null };

// Applies the delete in memory, cascading to the Video's Feedback like the
// database does, so a case asserts the rows it ends up holding.
function fakeDb({
  videos = [
    {
      id: "video_1",
      fileAssetId: "asset_file",
      posterAssetId: "asset_poster",
      project: { organizationId: "org_1" },
    },
  ],
  feedbacks = [] as FeedbackRow[],
  membership = { id: "member_1" },
}: {
  videos?: VideoRow[];
  feedbacks?: FeedbackRow[];
  membership?: { id: string } | null;
} = {}) {
  const state = { videos: [...videos], feedbacks: [...feedbacks] };
  const db = {
    video: {
      findUnique: vi.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve(state.videos.find((v) => v.id === where.id) ?? null),
      ),
      delete: vi.fn(({ where }: { where: { id: string } }) => {
        state.videos = state.videos.filter((v) => v.id !== where.id);
        state.feedbacks = state.feedbacks.filter((f) => f.videoId !== where.id);
        return Promise.resolve({ id: where.id });
      }),
    },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    feedback: {
      findMany: vi.fn(({ where }: { where: { videoId: string } }) =>
        Promise.resolve(
          state.feedbacks.filter(
            (f) => f.videoId === where.videoId && f.screenshotId !== null,
          ),
        ),
      ),
    },
  };
  return { db: db as unknown as FakeDb, state };
}

const input = { videoId: "video_1", userId: "user_1" };

describe("deleteVideo", () => {
  beforeEach(() => {
    deleteAssets.mockReset();
  });

  it("frees the file, the Poster and every Feedback screenshot in one call", async () => {
    const { db, state } = fakeDb({
      feedbacks: [
        { videoId: "video_1", screenshotId: "asset_shot_1" },
        { videoId: "video_1", screenshotId: null },
        { videoId: "video_1", screenshotId: "asset_shot_2" },
        { videoId: "video_2", screenshotId: "asset_other" },
      ],
    });

    await expect(deleteVideo(input, db)).resolves.toEqual({ id: "video_1" });
    expect(state.videos).toEqual([]);
    expect(state.feedbacks).toEqual([
      { videoId: "video_2", screenshotId: "asset_other" },
    ]);
    expect(deleteAssets).toHaveBeenCalledTimes(1);
    expect(deleteAssets).toHaveBeenCalledWith([
      "asset_file",
      "asset_poster",
      "asset_shot_1",
      "asset_shot_2",
    ]);
  });

  it("deletes an uploading Video that has no Assets yet", async () => {
    const { db, state } = fakeDb({
      videos: [
        {
          id: "video_1",
          fileAssetId: null,
          posterAssetId: null,
          project: { organizationId: "org_1" },
        },
      ],
    });

    await expect(deleteVideo(input, db)).resolves.toEqual({ id: "video_1" });
    expect(state.videos).toEqual([]);
    expect(deleteAssets).toHaveBeenCalledWith([]);
  });

  it("refuses a caller who is not a Member of the organization", async () => {
    const { db, state } = fakeDb({ membership: null });

    await expect(deleteVideo(input, db)).rejects.toThrow(
      new ForbiddenError("You are not a member of this project."),
    );
    expect(state.videos).toHaveLength(1);
    expect(deleteAssets).not.toHaveBeenCalled();
  });

  it("reports an unknown Video as not found", async () => {
    const { db } = fakeDb({ videos: [] });

    await expect(deleteVideo(input, db)).rejects.toThrow(
      new NotFoundError("Video not found."),
    );
    expect(deleteAssets).not.toHaveBeenCalled();
  });
});
