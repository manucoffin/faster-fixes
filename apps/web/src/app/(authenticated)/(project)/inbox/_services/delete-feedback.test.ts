import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/server/errors/domain-errors";
import { deleteAsset } from "@/server/storage/delete-asset";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteFeedback } from "./delete-feedback";

vi.mock("@/server/storage/delete-asset", () => ({
  deleteAsset: vi.fn().mockResolvedValue(undefined),
}));

type FakeDb = NonNullable<Parameters<typeof deleteFeedback>[1]>;

type FakeFeedback = {
  status: string;
  screenshotId: string | null;
  recordingId: string | null;
  project: { organizationId: string };
};

function fakeDb(
  feedback: FakeFeedback | null,
  membership: { id: string } | null,
) {
  return {
    feedback: {
      findUnique: vi.fn().mockResolvedValue(feedback),
      delete: vi.fn().mockResolvedValue({ id: "feedback_1" }),
    },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
  } as unknown as FakeDb;
}

const archived: FakeFeedback = {
  status: "closed",
  screenshotId: null,
  recordingId: null,
  project: { organizationId: "org_1" },
};

const input = { feedbackId: "feedback_1", userId: "user_1" };

describe("deleteFeedback", () => {
  beforeEach(() => {
    vi.mocked(deleteAsset).mockClear();
  });

  it("reports an unknown feedback as not found", async () => {
    await expect(deleteFeedback(input, fakeDb(null, null))).rejects.toThrow(
      new NotFoundError("Feedback not found."),
    );
  });

  it("refuses a feedback that is not archived", async () => {
    const db = fakeDb({ ...archived, status: "new" }, { id: "member_1" });

    await expect(deleteFeedback(input, db)).rejects.toThrow(
      new BadRequestError("Only archived feedback can be permanently deleted."),
    );
  });

  it("refuses a caller who is not a member of the project's organization", async () => {
    await expect(deleteFeedback(input, fakeDb(archived, null))).rejects.toThrow(
      new ForbiddenError("Access denied."),
    );
  });

  it("removes an archived feedback for a member caller", async () => {
    const db = fakeDb(archived, { id: "member_1" });

    await expect(deleteFeedback(input, db)).resolves.toEqual({
      id: "feedback_1",
    });
    expect(db.feedback.delete).toHaveBeenCalledWith({
      where: { id: "feedback_1" },
    });
  });

  it("frees the screenshot and the Recording of the feedback", async () => {
    const db = fakeDb(
      { ...archived, screenshotId: "asset_1", recordingId: "recording_1" },
      { id: "member_1" },
    );

    await deleteFeedback(input, db);

    expect(deleteAsset).toHaveBeenCalledWith("asset_1");
    expect(deleteAsset).toHaveBeenCalledWith("recording_1");
  });
});
