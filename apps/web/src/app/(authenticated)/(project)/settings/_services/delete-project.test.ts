import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteAssets = vi.fn();

vi.mock("@/server/storage/delete-assets", () => ({ deleteAssets }));

const { deleteProject } = await import("./delete-project");

type FakeDb = NonNullable<Parameters<typeof deleteProject>[1]>;

function fakeDb({
  project = { id: "project_1", organizationId: "org_1" },
  membership = { id: "member_1" },
  screenshots = [] as { screenshotId: string | null }[],
}: {
  project?: { id: string; organizationId: string } | null;
  membership?: { id: string } | null;
  screenshots?: { screenshotId: string | null }[];
} = {}) {
  return {
    project: {
      findUnique: vi.fn().mockResolvedValue(project),
      delete: vi.fn().mockResolvedValue(project),
    },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    feedback: { findMany: vi.fn().mockResolvedValue(screenshots) },
  } as unknown as FakeDb;
}

const input = { projectId: "project_1", userId: "user_1" };

describe("deleteProject", () => {
  beforeEach(() => {
    deleteAssets.mockReset();
  });

  it("reports an unknown project as not found", async () => {
    const db = fakeDb({ project: null });

    await expect(deleteProject(input, db)).rejects.toThrow(
      new NotFoundError("Project not found."),
    );
    expect(db.project.delete).not.toHaveBeenCalled();
  });

  it("refuses a caller who is neither owner nor admin of the organization", async () => {
    const db = fakeDb({ membership: null });

    await expect(deleteProject(input, db)).rejects.toThrow(
      new ForbiddenError("Access denied."),
    );
    expect(db.project.delete).not.toHaveBeenCalled();
    expect(deleteAssets).not.toHaveBeenCalled();
  });

  it("frees the screenshot of every feedback once the project is deleted", async () => {
    const db = fakeDb({
      screenshots: [{ screenshotId: "asset_1" }, { screenshotId: "asset_2" }],
    });

    await expect(deleteProject(input, db)).resolves.toEqual({
      id: "project_1",
    });
    expect(db.project.delete).toHaveBeenCalledWith({
      where: { id: "project_1" },
    });
    expect(deleteAssets).toHaveBeenCalledWith(["asset_1", "asset_2"]);
  });
});
