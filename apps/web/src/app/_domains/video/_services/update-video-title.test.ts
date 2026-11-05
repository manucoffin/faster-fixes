import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import { updateVideoTitle } from "./update-video-title";

type FakeDb = NonNullable<Parameters<typeof updateVideoTitle>[1]>;

type VideoRow = {
  id: string;
  title: string;
  project: { organizationId: string };
};

function fakeDb({
  videos = [
    {
      id: "video_1",
      title: "Launch cut",
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
          data: { title: string };
        }) => {
          const video = state.videos.find((v) => v.id === where.id)!;
          video.title = data.title;
          return Promise.resolve({ id: video.id, title: video.title });
        },
      ),
    },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
  };
  return { db: db as unknown as FakeDb, state };
}

describe("updateVideoTitle", () => {
  it("stores the title trimmed", async () => {
    const { db, state } = fakeDb();

    await expect(
      updateVideoTitle(
        { videoId: "video_1", title: "  Final cut  ", userId: "user_1" },
        db,
      ),
    ).resolves.toEqual({ id: "video_1", title: "Final cut" });
    expect(state.videos[0]?.title).toBe("Final cut");
  });

  it("accepts a title of exactly 120 characters", async () => {
    const { db, state } = fakeDb();
    const title = "a".repeat(120);

    await updateVideoTitle({ videoId: "video_1", title, userId: "user_1" }, db);
    expect(state.videos[0]?.title).toBe(title);
  });

  it.each([
    ["an empty title", "", "Enter a title."],
    ["a blank title", "   ", "Enter a title."],
    [
      "a title over 120 characters",
      "a".repeat(121),
      "Use 120 characters or fewer.",
    ],
  ])("refuses %s", async (_, title, message) => {
    const { db, state } = fakeDb();

    await expect(
      updateVideoTitle({ videoId: "video_1", title, userId: "user_1" }, db),
    ).rejects.toThrow(new BadRequestError(message));
    expect(state.videos[0]?.title).toBe("Launch cut");
  });

  it("refuses a caller who is not a Member of the organization", async () => {
    const { db, state } = fakeDb({ membership: null });

    await expect(
      updateVideoTitle(
        { videoId: "video_1", title: "Final cut", userId: "user_2" },
        db,
      ),
    ).rejects.toThrow(
      new ForbiddenError("You are not a member of this project."),
    );
    expect(state.videos[0]?.title).toBe("Launch cut");
  });

  it("answers not found for an unknown Video", async () => {
    const { db } = fakeDb({ videos: [] });

    await expect(
      updateVideoTitle(
        { videoId: "video_1", title: "Final cut", userId: "user_1" },
        db,
      ),
    ).rejects.toThrow(new NotFoundError("Video not found."));
  });
});
