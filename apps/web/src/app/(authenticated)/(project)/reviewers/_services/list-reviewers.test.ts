import { ForbiddenError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import { listReviewers } from "./list-reviewers";

type FakeDb = NonNullable<Parameters<typeof listReviewers>[1]>;

type FakeReviewer = {
  id: string;
  name: string;
  token: string;
  isActive: boolean;
  createdAt: Date;
  videoId: string | null;
  _count: { feedback: number };
};

function reviewer(id: string, videoId: string | null): FakeReviewer {
  return {
    id,
    name: id,
    token: `token_${id}`,
    isActive: true,
    createdAt: new Date("2026-11-01T00:00:00Z"),
    videoId,
    _count: { feedback: 0 },
  };
}

// Applies the `videoId` filter of the query, as the database would.
function fakeDb(membership: { id: string } | null, reviewers: FakeReviewer[]) {
  return {
    project: {
      findUnique: vi.fn().mockResolvedValue({
        id: "project_1",
        organizationId: "org_1",
        domain: "example.com",
      }),
    },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    reviewer: {
      findMany: vi.fn(({ where }: { where: { videoId?: null } }) =>
        Promise.resolve(
          reviewers.filter((r) =>
            "videoId" in where ? r.videoId === where.videoId : true,
          ),
        ),
      ),
    },
  } as unknown as FakeDb;
}

const input = { projectId: "project_1", userId: "user_1" };

describe("listReviewers", () => {
  it("refuses a caller who is not a member of the project's organization", async () => {
    await expect(listReviewers(input, fakeDb(null, []))).rejects.toThrow(
      new ForbiddenError("Access denied."),
    );
  });

  it("lists Widget Reviewers and leaves out Reviewers of a Share link", async () => {
    const db = fakeDb({ id: "member_1" }, [
      reviewer("widget_reviewer", null),
      reviewer("video_reviewer", "video_1"),
    ]);

    const result = await listReviewers(input, db);

    expect(result.map((r) => r.id)).toEqual(["widget_reviewer"]);
    expect(result[0]?.shareUrl).toBe(
      "https://example.com?ff_token=token_widget_reviewer",
    );
  });
});
