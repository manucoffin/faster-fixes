import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import { listSources } from "./list-sources";

type FakeDb = NonNullable<Parameters<typeof listSources>[1]>;

function fakeDb(
  project: { organizationId: string } | null,
  membership: { id: string } | null,
  pageUrls: Array<string | null> = [
    "https://example.com/a",
    "https://example.com/b",
  ],
  videos: Array<{ id: string; title: string }> = [
    { id: "video_1", title: "Launch cut" },
  ],
) {
  return {
    project: { findUnique: vi.fn().mockResolvedValue(project) },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    feedback: {
      findMany: vi
        .fn()
        .mockResolvedValue(pageUrls.map((pageUrl) => ({ pageUrl }))),
    },
    video: { findMany: vi.fn().mockResolvedValue(videos) },
  } as unknown as FakeDb;
}

const input = { projectId: "project_1", userId: "user_1" };

describe("listSources", () => {
  it("reports an unknown project as not found", async () => {
    await expect(
      listSources(input, fakeDb(null, { id: "member_1" })),
    ).rejects.toThrow(new NotFoundError("Project not found."));
  });

  it("refuses a caller who is not a member of the project's organization", async () => {
    const db = fakeDb({ organizationId: "org_1" }, null);

    await expect(listSources(input, db)).rejects.toThrow(
      new ForbiddenError("Access denied."),
    );
    expect(db.feedback.findMany).not.toHaveBeenCalled();
    expect(db.video.findMany).not.toHaveBeenCalled();
  });

  it("returns the page URLs and the Videos of the project for a member caller", async () => {
    const db = fakeDb({ organizationId: "org_1" }, { id: "member_1" });

    await expect(listSources(input, db)).resolves.toEqual({
      pageUrls: ["https://example.com/a", "https://example.com/b"],
      videos: [{ id: "video_1", title: "Launch cut" }],
    });
    expect(db.member.findFirst).toHaveBeenCalledWith({
      where: { organizationId: "org_1", userId: "user_1" },
    });
    expect(db.video.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { projectId: "project_1" } }),
    );
  });

  it("lists each page URL once and leaves out the Feedback without one", async () => {
    const db = fakeDb(
      { organizationId: "org_1" },
      { id: "member_1" },
      [null, "https://example.com/a", "https://example.com/a"],
      [],
    );

    await expect(listSources(input, db)).resolves.toEqual({
      pageUrls: ["https://example.com/a"],
      videos: [],
    });
  });
});
