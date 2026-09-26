import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import { listDistinctPageUrls } from "./list-distinct-page-urls";

type FakeDb = NonNullable<Parameters<typeof listDistinctPageUrls>[1]>;

function fakeDb(
  project: { organizationId: string } | null,
  membership: { id: string } | null,
) {
  return {
    project: { findUnique: vi.fn().mockResolvedValue(project) },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    feedback: {
      findMany: vi
        .fn()
        .mockResolvedValue([
          { pageUrl: "https://example.com/a" },
          { pageUrl: "https://example.com/b" },
        ]),
    },
  } as unknown as FakeDb;
}

const input = { projectId: "project_1", userId: "user_1" };

describe("listDistinctPageUrls", () => {
  it("reports an unknown project as not found", async () => {
    await expect(
      listDistinctPageUrls(input, fakeDb(null, { id: "member_1" })),
    ).rejects.toThrow(new NotFoundError("Project not found."));
  });

  it("refuses a caller who is not a member of the project's organization", async () => {
    await expect(
      listDistinctPageUrls(input, fakeDb({ organizationId: "org_1" }, null)),
    ).rejects.toThrow(new ForbiddenError("Access denied."));
  });

  it("returns the page URLs of the project for a member caller", async () => {
    const db = fakeDb({ organizationId: "org_1" }, { id: "member_1" });

    await expect(listDistinctPageUrls(input, db)).resolves.toEqual([
      "https://example.com/a",
      "https://example.com/b",
    ]);
    expect(db.member.findFirst).toHaveBeenCalledWith({
      where: { organizationId: "org_1", userId: "user_1" },
    });
  });
});
