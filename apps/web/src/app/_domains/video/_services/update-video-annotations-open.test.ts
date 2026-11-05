import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import { updateVideoAnnotationsOpen } from "./update-video-annotations-open";

type FakeDb = NonNullable<Parameters<typeof updateVideoAnnotationsOpen>[1]>;

type VideoRow = {
  id: string;
  annotationsOpen: boolean;
  project: { organizationId: string };
};

function fakeDb({
  videos = [
    {
      id: "video_1",
      annotationsOpen: true,
      project: { organizationId: "org_1" },
    },
  ],
  membership = { id: "member_1" },
}: { videos?: VideoRow[]; membership?: { id: string } | null } = {}) {
  const state = { videos: videos.map((video) => ({ ...video })) };
  const db = {
    video: {
      findUnique: vi.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve(state.videos.find((v) => v.id === where.id) ?? null),
      ),
      update: vi.fn(
        ({
          where,
          data,
        }: {
          where: { id: string };
          data: { annotationsOpen: boolean };
        }) => {
          const video = state.videos.find((v) => v.id === where.id)!;
          video.annotationsOpen = data.annotationsOpen;
          return Promise.resolve({
            id: video.id,
            annotationsOpen: video.annotationsOpen,
          });
        },
      ),
    },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
  };
  return { db: db as unknown as FakeDb, state };
}

describe("updateVideoAnnotationsOpen", () => {
  it("closes and reopens annotations", async () => {
    const { db, state } = fakeDb();

    await expect(
      updateVideoAnnotationsOpen(
        { videoId: "video_1", open: false, userId: "user_1" },
        db,
      ),
    ).resolves.toEqual({ id: "video_1", annotationsOpen: false });
    expect(state.videos[0]?.annotationsOpen).toBe(false);

    await updateVideoAnnotationsOpen(
      { videoId: "video_1", open: true, userId: "user_1" },
      db,
    );
    expect(state.videos[0]?.annotationsOpen).toBe(true);
  });

  it("refuses a caller who is not a Member of the organization", async () => {
    const { db, state } = fakeDb({ membership: null });

    await expect(
      updateVideoAnnotationsOpen(
        { videoId: "video_1", open: false, userId: "user_2" },
        db,
      ),
    ).rejects.toThrow(
      new ForbiddenError("You are not a member of this project."),
    );
    expect(state.videos[0]?.annotationsOpen).toBe(true);
  });

  it("answers not found for an unknown Video", async () => {
    const { db } = fakeDb({ videos: [] });

    await expect(
      updateVideoAnnotationsOpen(
        { videoId: "video_1", open: false, userId: "user_1" },
        db,
      ),
    ).rejects.toThrow(new NotFoundError("Video not found."));
  });
});
