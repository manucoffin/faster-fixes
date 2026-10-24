import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { deleteAssets } from "@/server/storage/delete-assets";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteFeedbacks } from "./delete-feedbacks";

vi.mock("@/server/storage/delete-assets", () => ({
  deleteAssets: vi.fn().mockResolvedValue(undefined),
}));

type FakeDb = NonNullable<Parameters<typeof deleteFeedbacks>[1]>;

type FakeState = {
  project: { organizationId: string } | null;
  membership: { id: string } | null;
  candidates?: Array<{ screenshotId: string | null }>;
  deletedCount?: number;
  orphanedAssets?: Array<{ id: string }>;
};

function fakeDb({
  project,
  membership,
  candidates = [],
  deletedCount = candidates.length,
  orphanedAssets = [],
}: FakeState) {
  return {
    project: { findUnique: vi.fn().mockResolvedValue(project) },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    feedback: {
      findMany: vi.fn().mockResolvedValue(candidates),
      deleteMany: vi.fn().mockResolvedValue({ count: deletedCount }),
    },
    asset: { findMany: vi.fn().mockResolvedValue(orphanedAssets) },
  } as unknown as FakeDb;
}

const project = { organizationId: "org_1" };
const member = { id: "member_1" };

const input = {
  projectId: "project_1",
  feedbackIds: ["feedback_1", "feedback_2", "feedback_3"],
  userId: "user_1",
};

const scopedWhere = {
  id: { in: input.feedbackIds },
  projectId: "project_1",
  status: "closed",
};

describe("deleteFeedbacks", () => {
  beforeEach(() => {
    vi.mocked(deleteAssets).mockClear();
  });

  it("reports an unknown project as not found", async () => {
    const db = fakeDb({ project: null, membership: null });

    await expect(deleteFeedbacks(input, db)).rejects.toThrow(
      new NotFoundError("Project not found."),
    );
  });

  it("refuses a caller who is not a member of the project's organization", async () => {
    const db = fakeDb({ project, membership: null });

    await expect(deleteFeedbacks(input, db)).rejects.toThrow(
      new ForbiddenError("Access denied."),
    );
    expect(db.feedback.deleteMany).not.toHaveBeenCalled();
  });

  it("deletes only archived feedback of the project and reports the real count", async () => {
    const db = fakeDb({
      project,
      membership: member,
      candidates: [{ screenshotId: null }, { screenshotId: null }],
    });

    await expect(deleteFeedbacks(input, db)).resolves.toEqual({
      deleted: 2,
      requested: 3,
    });
    expect(db.feedback.findMany).toHaveBeenCalledWith({
      where: scopedWhere,
      select: { screenshotId: true },
    });
    expect(db.feedback.deleteMany).toHaveBeenCalledWith({
      where: scopedWhere,
    });
  });

  it("counts a repeated id once", async () => {
    const db = fakeDb({ project, membership: member });

    await expect(
      deleteFeedbacks(
        { ...input, feedbackIds: ["feedback_1", "feedback_1"] },
        db,
      ),
    ).resolves.toEqual({ deleted: 0, requested: 1 });
  });

  it("deletes nothing when no id is still archived in the project", async () => {
    const db = fakeDb({ project, membership: member });

    await expect(deleteFeedbacks(input, db)).resolves.toEqual({
      deleted: 0,
      requested: 3,
    });
    expect(db.feedback.deleteMany).not.toHaveBeenCalled();
    expect(deleteAssets).not.toHaveBeenCalled();
  });

  it("frees only the screenshots no feedback references anymore", async () => {
    const db = fakeDb({
      project,
      membership: member,
      candidates: [
        { screenshotId: "asset_1" },
        { screenshotId: "asset_2" },
        { screenshotId: null },
      ],
      orphanedAssets: [{ id: "asset_1" }],
    });

    await deleteFeedbacks(input, db);

    expect(db.asset.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["asset_1", "asset_2"] },
        feedbackScreenshots: { none: {} },
      },
      select: { id: true },
    });
    expect(deleteAssets).toHaveBeenCalledWith(["asset_1"]);
  });
});
