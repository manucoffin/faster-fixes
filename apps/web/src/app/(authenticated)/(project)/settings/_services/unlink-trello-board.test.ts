import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { unlinkTrelloBoard } from "./unlink-trello-board";

type FakeDb = NonNullable<Parameters<typeof unlinkTrelloBoard>[1]>;

type FakeDbState = {
  project?: { organizationId: string } | null;
  membership?: { id: string } | null;
  deleteMany?: ReturnType<typeof vi.fn>;
};

function fakeDb({
  project = { organizationId: "org_1" },
  membership = { id: "member_1" },
  deleteMany = vi.fn().mockResolvedValue({ count: 1 }),
}: FakeDbState = {}) {
  return {
    project: { findUnique: vi.fn().mockResolvedValue(project) },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    projectTrelloLink: { deleteMany },
  } as unknown as FakeDb;
}

const input = { projectId: "project_1", userId: "user_1" };

describe("unlinkTrelloBoard", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports an unknown project as not found", async () => {
    await expect(
      unlinkTrelloBoard(input, fakeDb({ project: null })),
    ).rejects.toThrow(new NotFoundError("Project not found."));
  });

  it("refuses a caller who is not an owner or an admin", async () => {
    const deleteMany = vi.fn();

    await expect(
      unlinkTrelloBoard(input, fakeDb({ membership: null, deleteMany })),
    ).rejects.toThrow(
      new ForbiddenError("Only owners and admins can unlink Trello boards."),
    );
    expect(deleteMany).not.toHaveBeenCalled();
  });

  // The fake has no subscription and no Installation: unlinking reads neither,
  // so a downgraded or disconnected Organization can still unlink.
  it("deletes the link on the Free plan", async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });

    await expect(
      unlinkTrelloBoard(input, fakeDb({ deleteMany })),
    ).resolves.toEqual({ success: true });
    expect(deleteMany).toHaveBeenCalledWith({
      where: { projectId: "project_1" },
    });
  });
});
