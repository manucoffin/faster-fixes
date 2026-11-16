import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/server/errors/domain-errors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const registerTrelloBoardWebhook = vi.fn();

vi.mock(
  "@/app/_domains/integration/_services/trello/register-trello-board-webhook",
  () => ({ registerTrelloBoardWebhook }),
);

const { linkTrelloBoard } = await import("./link-trello-board");

type FakeDb = NonNullable<Parameters<typeof linkTrelloBoard>[1]>;

type FakeDbState = {
  project?: { organizationId: string } | null;
  membership?: { id: string } | null;
  installation?: { id: string; healthState: string } | null;
  subscription?: { plan: string; status: string } | null;
  existingLink?: { id: string } | null;
  create?: ReturnType<typeof vi.fn>;
  update?: ReturnType<typeof vi.fn>;
  deleteLink?: ReturnType<typeof vi.fn>;
};

function fakeDb({
  project = { organizationId: "org_1" },
  membership = { id: "member_1" },
  installation = { id: "installation_1", healthState: "connected" },
  subscription = { plan: "pro", status: "active" },
  existingLink = null,
  create = vi.fn().mockResolvedValue({ id: "link_1" }),
  update = vi.fn().mockResolvedValue({ id: "link_1" }),
  deleteLink = vi.fn().mockResolvedValue({ id: "link_1" }),
}: FakeDbState = {}) {
  return {
    project: { findUnique: vi.fn().mockResolvedValue(project) },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    trelloInstallation: {
      findUnique: vi.fn().mockResolvedValue(installation),
    },
    subscription: { findFirst: vi.fn().mockResolvedValue(subscription) },
    projectTrelloLink: {
      findUnique: vi.fn().mockResolvedValue(existingLink),
      create,
      update,
      delete: deleteLink,
    },
  } as unknown as FakeDb;
}

const input = {
  projectId: "project_1",
  boardId: "board_1",
  boardName: "Website",
  boardUrl: "https://trello.com/b/abc123/website",
  newListId: "list_new",
  inProgressListId: "list_doing",
  resolvedListId: "list_done",
  userId: "user_1",
};

describe("linkTrelloBoard", () => {
  // Plans are only enforced on cloud; self-hosted resolves to Agency.
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "true");
    registerTrelloBoardWebhook.mockReset();
    registerTrelloBoardWebhook.mockResolvedValue("webhook_1");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports an unknown project as not found", async () => {
    await expect(
      linkTrelloBoard(input, fakeDb({ project: null })),
    ).rejects.toThrow(new NotFoundError("Project not found."));
  });

  it("refuses a caller who is not an owner or an admin", async () => {
    await expect(
      linkTrelloBoard(input, fakeDb({ membership: null })),
    ).rejects.toThrow(
      new ForbiddenError("Only owners and admins can link Trello boards."),
    );
  });

  it("reports an organization with no installation as a bad request", async () => {
    await expect(
      linkTrelloBoard(input, fakeDb({ installation: null })),
    ).rejects.toThrow(
      new BadRequestError("Trello is not connected. Connect Trello first."),
    );
  });

  it("refuses an installation that needs re-authorization", async () => {
    await expect(
      linkTrelloBoard(
        input,
        fakeDb({
          installation: {
            id: "installation_1",
            healthState: "reconnect_required",
          },
        }),
      ),
    ).rejects.toThrow(
      new BadRequestError("The Trello connection needs to be re-authorized."),
    );
  });

  it("refuses an organization on the Free plan", async () => {
    const create = vi.fn();

    await expect(
      linkTrelloBoard(input, fakeDb({ subscription: null, create })),
    ).rejects.toThrow(
      new ForbiddenError(
        "Trello integration is available on paid plans. Upgrade your plan to link a Trello board.",
      ),
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("links on the Agency plan", async () => {
    await expect(
      linkTrelloBoard(
        input,
        fakeDb({ subscription: { plan: "agency", status: "active" } }),
      ),
    ).resolves.toEqual({ id: "link_1" });
  });

  it("links on a self-hosted instance without a subscription", async () => {
    vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "false");

    await expect(
      linkTrelloBoard(input, fakeDb({ subscription: null })),
    ).resolves.toEqual({ id: "link_1" });
  });

  it("refuses a mapping without a list for new", async () => {
    await expect(
      linkTrelloBoard({ ...input, newListId: "" }, fakeDb()),
    ).rejects.toThrow(new BadRequestError("Select a list for New."));
  });

  it("refuses a mapping without a list for resolved", async () => {
    await expect(
      linkTrelloBoard({ ...input, resolvedListId: "" }, fakeDb()),
    ).rejects.toThrow(new BadRequestError("Select a list for Resolved."));
  });

  it.each([
    {
      newListId: "list_a",
      inProgressListId: "list_a",
      resolvedListId: "list_b",
    },
    { newListId: "list_a", inProgressListId: null, resolvedListId: "list_a" },
    {
      newListId: "list_a",
      inProgressListId: "list_b",
      resolvedListId: "list_b",
    },
  ])("refuses one list mapped to two statuses: %o", async (mapping) => {
    const create = vi.fn();

    await expect(
      linkTrelloBoard({ ...input, ...mapping }, fakeDb({ create })),
    ).rejects.toThrow(
      new BadRequestError("This list already stands for another status."),
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses to replace the board of an existing link", async () => {
    const create = vi.fn();

    await expect(
      linkTrelloBoard(
        input,
        fakeDb({ existingLink: { id: "link_0" }, create }),
      ),
    ).rejects.toThrow(
      new ConflictError(
        "This project is already linked to a Trello board. Unlink it to choose another board.",
      ),
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("stores the board and its mapped lists", async () => {
    const create = vi.fn().mockResolvedValue({ id: "link_1" });

    await expect(linkTrelloBoard(input, fakeDb({ create }))).resolves.toEqual({
      id: "link_1",
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        projectId: "project_1",
        trelloInstallationId: "installation_1",
        boardId: "board_1",
        boardName: "Website",
        boardUrl: "https://trello.com/b/abc123/website",
        newListId: "list_new",
        inProgressListId: "list_doing",
        resolvedListId: "list_done",
      },
      select: { id: true },
    });
  });

  it("links without an in-progress list", async () => {
    const create = vi.fn().mockResolvedValue({ id: "link_1" });

    await linkTrelloBoard(
      { ...input, inProgressListId: null },
      fakeDb({ create }),
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ inProgressListId: null }),
      }),
    );
  });

  it("registers one webhook on the board and stores its id", async () => {
    const update = vi.fn().mockResolvedValue({ id: "link_1" });

    await linkTrelloBoard(input, fakeDb({ update }));

    expect(registerTrelloBoardWebhook).toHaveBeenCalledTimes(1);
    expect(registerTrelloBoardWebhook).toHaveBeenCalledWith("org_1", {
      linkId: "link_1",
      boardId: "board_1",
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: "link_1" },
      data: { webhookId: "webhook_1" },
    });
  });

  it("fails the link when the webhook cannot be registered", async () => {
    const failure = new Error("Trello request failed (400)");
    registerTrelloBoardWebhook.mockRejectedValue(failure);
    const update = vi.fn();
    const deleteLink = vi.fn().mockResolvedValue({ id: "link_1" });

    await expect(
      linkTrelloBoard(input, fakeDb({ update, deleteLink })),
    ).rejects.toThrow(failure);
    expect(deleteLink).toHaveBeenCalledWith({ where: { id: "link_1" } });
    expect(update).not.toHaveBeenCalled();
  });

  it("registers no webhook when the link is refused", async () => {
    await expect(
      linkTrelloBoard(input, fakeDb({ subscription: null })),
    ).rejects.toThrow(ForbiddenError);
    expect(registerTrelloBoardWebhook).not.toHaveBeenCalled();
  });
});
