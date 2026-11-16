import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const deleteTrelloBoardWebhooks = vi.fn();

vi.mock(
  "@/app/_domains/integration/_services/trello/delete-trello-board-webhooks",
  () => ({ deleteTrelloBoardWebhooks }),
);

const { unlinkTrelloBoard } = await import("./unlink-trello-board");

type FakeDb = NonNullable<Parameters<typeof unlinkTrelloBoard>[1]>;

type FakeLink = {
  webhookId: string | null;
  trelloInstallation: { healthState: string };
};

type FakeDbState = {
  project?: { organizationId: string } | null;
  membership?: { id: string } | null;
  link?: FakeLink | null;
  deleteMany?: ReturnType<typeof vi.fn>;
};

function fakeDb({
  project = { organizationId: "org_1" },
  membership = { id: "member_1" },
  link = {
    webhookId: "webhook_1",
    trelloInstallation: { healthState: "connected" },
  },
  deleteMany = vi.fn().mockResolvedValue({ count: 1 }),
}: FakeDbState = {}) {
  return {
    project: { findUnique: vi.fn().mockResolvedValue(project) },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    projectTrelloLink: {
      findUnique: vi.fn().mockResolvedValue(link),
      deleteMany,
    },
  } as unknown as FakeDb;
}

const input = { projectId: "project_1", userId: "user_1" };

describe("unlinkTrelloBoard", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "true");
    deleteTrelloBoardWebhooks.mockReset();
    deleteTrelloBoardWebhooks.mockResolvedValue(undefined);
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
    expect(deleteTrelloBoardWebhooks).not.toHaveBeenCalled();
  });

  // The fake has no subscription: unlinking reads none, so a downgraded
  // Organization can still unlink.
  it("deletes the link on the Free plan", async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });

    await expect(
      unlinkTrelloBoard(input, fakeDb({ deleteMany })),
    ).resolves.toEqual({ success: true });
    expect(deleteMany).toHaveBeenCalledWith({
      where: { projectId: "project_1" },
    });
  });

  it("removes the webhook, then deletes the link", async () => {
    const calls: string[] = [];
    deleteTrelloBoardWebhooks.mockImplementation(async () => {
      calls.push("webhook");
    });
    const deleteMany = vi.fn().mockImplementation(async () => {
      calls.push("link");
      return { count: 1 };
    });

    await unlinkTrelloBoard(input, fakeDb({ deleteMany }));

    expect(deleteTrelloBoardWebhooks).toHaveBeenCalledWith("org_1", [
      "webhook_1",
    ]);
    expect(calls).toEqual(["webhook", "link"]);
  });

  it("deletes the link without a Trello call while the grant is dead", async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });

    await unlinkTrelloBoard(
      input,
      fakeDb({
        link: {
          webhookId: "webhook_1",
          trelloInstallation: { healthState: "reconnect_required" },
        },
        deleteMany,
      }),
    );

    expect(deleteTrelloBoardWebhooks).not.toHaveBeenCalled();
    expect(deleteMany).toHaveBeenCalled();
  });

  it("deletes a link that has no webhook", async () => {
    await unlinkTrelloBoard(
      input,
      fakeDb({
        link: {
          webhookId: null,
          trelloInstallation: { healthState: "connected" },
        },
      }),
    );

    expect(deleteTrelloBoardWebhooks).not.toHaveBeenCalled();
  });
});
