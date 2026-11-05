import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import {
  decryptShareLinkSecret,
  generateShareLinkSecret,
  hashShareLinkSecret,
} from "../_helpers/share-link-secret";
import { replaceVideoShareLink } from "./replace-video-share-link";

type FakeDb = NonNullable<Parameters<typeof replaceVideoShareLink>[1]>;

type VideoRow = {
  id: string;
  shareTokenHash: string;
  shareTokenEncrypted: string;
  project: { organizationId: string };
};

vi.stubEnv("BETTER_AUTH_SECRET", "test-auth-secret");

const original = generateShareLinkSecret();

function fakeDb({
  videos = [
    {
      id: "video_1",
      shareTokenHash: original.hash,
      shareTokenEncrypted: original.encrypted,
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
          data: Pick<VideoRow, "shareTokenHash" | "shareTokenEncrypted">;
        }) => {
          const video = state.videos.find((v) => v.id === where.id)!;
          Object.assign(video, data);
          return Promise.resolve({ id: video.id });
        },
      ),
    },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
  };
  return { db: db as unknown as FakeDb, state };
}

const input = { videoId: "video_1", userId: "user_1" };

function secretOf(shareUrl: string) {
  return decodeURIComponent(shareUrl.split("/review/")[1] ?? "");
}

describe("replaceVideoShareLink", () => {
  it("stores a new hash the old secret no longer matches", async () => {
    const { db, state } = fakeDb();

    const { shareUrl } = await replaceVideoShareLink(input, db);
    const video = state.videos[0]!;

    expect(video.shareTokenHash).not.toBe(original.hash);
    expect(hashShareLinkSecret(original.secret)).not.toBe(video.shareTokenHash);
    expect(hashShareLinkSecret(secretOf(shareUrl))).toBe(video.shareTokenHash);
  });

  it("stores an encrypted value that decrypts to the returned link", async () => {
    const { db, state } = fakeDb();

    const { shareUrl } = await replaceVideoShareLink(input, db);
    const secret = decryptShareLinkSecret(state.videos[0]!.shareTokenEncrypted);

    expect(secret).not.toBe(original.secret);
    expect(shareUrl).toMatch(/\/review\/[^/]+$/);
    expect(secretOf(shareUrl)).toBe(secret);
  });

  it("refuses a caller who is not a Member of the organization", async () => {
    const { db, state } = fakeDb({ membership: null });

    await expect(replaceVideoShareLink(input, db)).rejects.toThrow(
      new ForbiddenError("You are not a member of this project."),
    );
    expect(state.videos[0]?.shareTokenHash).toBe(original.hash);
  });

  it("answers not found for an unknown Video", async () => {
    const { db } = fakeDb({ videos: [] });

    await expect(replaceVideoShareLink(input, db)).rejects.toThrow(
      new NotFoundError("Video not found."),
    );
  });
});
