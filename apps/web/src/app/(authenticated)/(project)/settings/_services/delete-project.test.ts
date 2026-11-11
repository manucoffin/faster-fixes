import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteAssets = vi.fn();

vi.mock("@/server/storage/delete-assets", () => ({ deleteAssets }));

const { deleteProject } = await import("./delete-project");

type FakeDb = NonNullable<Parameters<typeof deleteProject>[1]>;

type VideoAssets = { fileAssetId: string | null; posterAssetId: string | null };
type FeedbackAssets = {
  screenshotId: string | null;
  recordingId: string | null;
};

function fakeDb({
  project = { id: "project_1", organizationId: "org_1" },
  membership = { id: "member_1" },
  screenshots = [] as FeedbackAssets[],
  videos = [] as VideoAssets[],
}: {
  project?: { id: string; organizationId: string } | null;
  membership?: { id: string } | null;
  screenshots?: FeedbackAssets[];
  videos?: VideoAssets[];
} = {}) {
  return {
    project: {
      findUnique: vi.fn().mockResolvedValue(project),
      delete: vi.fn().mockResolvedValue(project),
    },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    feedback: { findMany: vi.fn().mockResolvedValue(screenshots) },
    video: { findMany: vi.fn().mockResolvedValue(videos) },
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
      screenshots: [
        { screenshotId: "asset_1", recordingId: null },
        { screenshotId: "asset_2", recordingId: null },
      ],
    });

    await expect(deleteProject(input, db)).resolves.toEqual({
      id: "project_1",
    });
    expect(db.project.delete).toHaveBeenCalledWith({
      where: { id: "project_1" },
    });
    expect(deleteAssets).toHaveBeenCalledWith(["asset_1", "asset_2"]);
  });

  it("frees the file and Poster of every Video with the screenshots in one call", async () => {
    const db = fakeDb({
      screenshots: [{ screenshotId: "asset_shot", recordingId: null }],
      videos: [
        { fileAssetId: "asset_file_1", posterAssetId: "asset_poster_1" },
        { fileAssetId: "asset_file_2", posterAssetId: null },
        { fileAssetId: null, posterAssetId: null },
      ],
    });

    await deleteProject(input, db);

    expect(db.video.findMany).toHaveBeenCalledWith({
      where: { projectId: "project_1" },
      select: { fileAssetId: true, posterAssetId: true },
    });
    expect(deleteAssets).toHaveBeenCalledTimes(1);
    expect(deleteAssets).toHaveBeenCalledWith([
      "asset_shot",
      "asset_file_1",
      "asset_poster_1",
      "asset_file_2",
    ]);
  });

  it("frees the Recording of every feedback with its screenshot", async () => {
    const db = fakeDb({
      screenshots: [
        { screenshotId: "asset_1", recordingId: "recording_1" },
        { screenshotId: null, recordingId: "recording_2" },
      ],
    });

    await deleteProject(input, db);

    expect(db.feedback.findMany).toHaveBeenCalledWith({
      where: {
        projectId: "project_1",
        OR: [{ screenshotId: { not: null } }, { recordingId: { not: null } }],
      },
      select: { screenshotId: true, recordingId: true },
    });
    expect(deleteAssets).toHaveBeenCalledWith([
      "asset_1",
      "recording_1",
      "recording_2",
    ]);
  });
});
