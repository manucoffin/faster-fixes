import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/server/errors/domain-errors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { updateProjectTrelloLink } from "./update-project-trello-link";

vi.mock("@/app/_domains/integration/_services/trello/token-access", () => ({
  withTrelloAccessToken: (
    _organizationId: string,
    call: (accessToken: string) => Promise<unknown>,
  ) => call("access_token"),
}));

const openBoard = {
  id: "board_1",
  closed: false,
  lists: [
    { id: "list_new", closed: false },
    { id: "list_doing", closed: false },
    { id: "list_done", closed: false },
    { id: "list_old", closed: true },
  ],
};

// Trello's answer to the board re-read of the link health check.
function stubTrelloBoard(status: number, body: unknown = openBoard) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

type FakeDb = NonNullable<Parameters<typeof updateProjectTrelloLink>[1]>;

type FakeDbState = {
  membership?: { id: string } | null;
  installation?: { id: string; healthState: string } | null;
  subscription?: { plan: string; status: string } | null;
  link?: { id: string; boardId: string } | null;
  update?: ReturnType<typeof vi.fn>;
};

function fakeDb({
  membership = { id: "member_1" },
  installation = { id: "installation_1", healthState: "connected" },
  subscription = { plan: "pro", status: "active" },
  link = { id: "link_1", boardId: "board_1" },
  update = vi.fn().mockResolvedValue({ id: "link_1" }),
}: FakeDbState = {}) {
  return {
    project: {
      findUnique: vi.fn().mockResolvedValue({ organizationId: "org_1" }),
    },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    trelloInstallation: {
      findUnique: vi.fn().mockResolvedValue(installation),
    },
    subscription: { findFirst: vi.fn().mockResolvedValue(subscription) },
    projectTrelloLink: {
      findUnique: vi.fn().mockResolvedValue(link),
      update,
    },
  } as unknown as FakeDb;
}

const lists = {
  newListId: "list_new",
  inProgressListId: "list_doing",
  resolvedListId: "list_done",
};

const input = { projectId: "project_1", userId: "user_1" };

describe("updateProjectTrelloLink", () => {
  // Plans are only enforced on cloud; self-hosted resolves to Agency.
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("refuses a caller who is not an owner or an admin", async () => {
    await expect(
      updateProjectTrelloLink(
        { ...input, autoCreateIssues: false },
        fakeDb({ membership: null }),
      ),
    ).rejects.toThrow(
      new ForbiddenError(
        "Only owners and admins can change Trello link settings.",
      ),
    );
  });

  it("refuses an organization on the Free plan", async () => {
    const update = vi.fn();

    await expect(
      updateProjectTrelloLink(
        { ...input, autoCreateIssues: false },
        fakeDb({ subscription: null, update }),
      ),
    ).rejects.toThrow(
      new ForbiddenError(
        "Trello integration is available on paid plans. Upgrade your plan to change this Trello board link.",
      ),
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("updates on a self-hosted instance without a subscription", async () => {
    vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "false");

    await expect(
      updateProjectTrelloLink(
        { ...input, autoCreateIssues: false },
        fakeDb({ subscription: null }),
      ),
    ).resolves.toEqual({ success: true });
  });

  it("reports a project with no link as not found", async () => {
    await expect(
      updateProjectTrelloLink(
        { ...input, autoCreateIssues: false },
        fakeDb({ link: null }),
      ),
    ).rejects.toThrow(
      new NotFoundError("This project is not linked to a Trello board."),
    );
  });

  it("refuses a mapping that removes the list for new", async () => {
    await expect(
      updateProjectTrelloLink(
        { ...input, lists: { ...lists, newListId: "" } },
        fakeDb(),
      ),
    ).rejects.toThrow(new BadRequestError("Select a list for New."));
  });

  it("refuses a mapping that removes the list for resolved", async () => {
    await expect(
      updateProjectTrelloLink(
        { ...input, lists: { ...lists, resolvedListId: "" } },
        fakeDb(),
      ),
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
    const update = vi.fn();

    await expect(
      updateProjectTrelloLink({ ...input, lists: mapping }, fakeDb({ update })),
    ).rejects.toThrow(
      new BadRequestError("This list already stands for another status."),
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("stores a new mapping, clearing the in-progress list", async () => {
    stubTrelloBoard(200);
    const update = vi.fn().mockResolvedValue({ id: "link_1" });

    await updateProjectTrelloLink(
      { ...input, lists: { ...lists, inProgressListId: null } },
      fakeDb({ update }),
    );
    expect(update).toHaveBeenCalledWith({
      where: { id: "link_1" },
      data: {
        newListId: "list_new",
        inProgressListId: null,
        resolvedListId: "list_done",
        linkHealthIssue: null,
      },
    });
  });

  it("records a stale list when a mapped list is archived", async () => {
    stubTrelloBoard(200);
    const update = vi.fn().mockResolvedValue({ id: "link_1" });

    await updateProjectTrelloLink(
      { ...input, lists: { ...lists, inProgressListId: "list_old" } },
      fakeDb({ update }),
    );
    expect(update).toHaveBeenCalledWith({
      where: { id: "link_1" },
      data: expect.objectContaining({ linkHealthIssue: "stale_list" }),
    });
  });

  it("records a stale list when a mapped list is missing from the board", async () => {
    stubTrelloBoard(200);
    const update = vi.fn().mockResolvedValue({ id: "link_1" });

    await updateProjectTrelloLink(
      { ...input, lists: { ...lists, resolvedListId: "list_deleted" } },
      fakeDb({ update }),
    );
    expect(update).toHaveBeenCalledWith({
      where: { id: "link_1" },
      data: expect.objectContaining({ linkHealthIssue: "stale_list" }),
    });
  });

  it("records a closed board", async () => {
    stubTrelloBoard(200, { ...openBoard, closed: true });
    const update = vi.fn().mockResolvedValue({ id: "link_1" });

    await updateProjectTrelloLink({ ...input, lists }, fakeDb({ update }));
    expect(update).toHaveBeenCalledWith({
      where: { id: "link_1" },
      data: expect.objectContaining({ linkHealthIssue: "board_closed" }),
    });
  });

  it.each([403, 404])(
    "records an unreachable board when Trello answers %i",
    async (status) => {
      stubTrelloBoard(status, "board not found");
      const update = vi.fn().mockResolvedValue({ id: "link_1" });

      await updateProjectTrelloLink({ ...input, lists }, fakeDb({ update }));
      expect(update).toHaveBeenCalledWith({
        where: { id: "link_1" },
        data: expect.objectContaining({ linkHealthIssue: "board_unreachable" }),
      });
    },
  );

  it("leaves the link untouched when Trello fails", async () => {
    stubTrelloBoard(503, "unavailable");
    const update = vi.fn();

    await expect(
      updateProjectTrelloLink({ ...input, lists }, fakeDb({ update })),
    ).rejects.toThrow();
    expect(update).not.toHaveBeenCalled();
  });

  it("changes only the fields it is given", async () => {
    const fetchMock = stubTrelloBoard(200);
    const update = vi.fn().mockResolvedValue({ id: "link_1" });

    await updateProjectTrelloLink(
      { ...input, defaultLabelIds: ["label_1"], autoCreateIssues: false },
      fakeDb({ update }),
    );
    expect(update).toHaveBeenCalledWith({
      where: { id: "link_1" },
      data: { defaultLabelIds: ["label_1"], autoCreateIssues: false },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
