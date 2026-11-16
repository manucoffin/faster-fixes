import { BadRequestError, ForbiddenError } from "@/server/errors/domain-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getFullOrganization = vi.fn();

vi.mock("@/server/auth", () => ({
  auth: { api: { getFullOrganization } },
}));

const deleteTrelloBoardWebhooks = vi.fn();

vi.mock(
  "@/app/_domains/integration/_services/trello/delete-trello-board-webhooks",
  () => ({ deleteTrelloBoardWebhooks }),
);

const { disconnectTrello } = await import("./disconnect-trello");

type FakeDb = NonNullable<Parameters<typeof disconnectTrello>[1]>;

type FakeInstallation = {
  healthState: string;
  projectLinks: { webhookId: string | null }[];
};

const connectedInstallation: FakeInstallation = {
  healthState: "connected",
  projectLinks: [{ webhookId: "webhook_1" }, { webhookId: "webhook_2" }],
};

function fakeDb(
  membership: { id: string } | null,
  installation: FakeInstallation | null = connectedInstallation,
  deleteMany = vi.fn().mockResolvedValue({ count: 1 }),
) {
  return {
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    trelloInstallation: {
      findUnique: vi.fn().mockResolvedValue(installation),
      deleteMany,
    },
  } as unknown as FakeDb;
}

const input = { headers: new Headers(), userId: "user_1" };

describe("disconnectTrello", () => {
  beforeEach(() => {
    getFullOrganization.mockReset();
    deleteTrelloBoardWebhooks.mockReset();
    deleteTrelloBoardWebhooks.mockResolvedValue(undefined);
  });

  it("refuses a session with no active organization", async () => {
    getFullOrganization.mockResolvedValue(null);
    const db = fakeDb({ id: "member_1" });

    await expect(disconnectTrello(input, db)).rejects.toThrow(
      new BadRequestError("No active organization."),
    );
    expect(db.trelloInstallation.deleteMany).not.toHaveBeenCalled();
  });

  it("refuses a caller who is not the organization owner", async () => {
    getFullOrganization.mockResolvedValue({ id: "org_1" });
    const db = fakeDb(null);

    await expect(disconnectTrello(input, db)).rejects.toThrow(
      new ForbiddenError("Only the organization owner can disconnect Trello."),
    );
    expect(db.member.findFirst).toHaveBeenCalledWith({
      where: { organizationId: "org_1", userId: "user_1", role: "owner" },
    });
    expect(db.trelloInstallation.deleteMany).not.toHaveBeenCalled();
    expect(deleteTrelloBoardWebhooks).not.toHaveBeenCalled();
  });

  it("drops the installation of the active organization for its owner", async () => {
    getFullOrganization.mockResolvedValue({ id: "org_1" });
    const db = fakeDb({ id: "member_1" });

    await expect(disconnectTrello(input, db)).resolves.toEqual({
      success: true,
    });
    expect(db.trelloInstallation.deleteMany).toHaveBeenCalledWith({
      where: { organizationId: "org_1" },
    });
  });

  it("removes every registered webhook, then drops the installation", async () => {
    getFullOrganization.mockResolvedValue({ id: "org_1" });
    const calls: string[] = [];
    deleteTrelloBoardWebhooks.mockImplementation(async () => {
      calls.push("webhooks");
    });
    const deleteMany = vi.fn().mockImplementation(async () => {
      calls.push("installation");
      return { count: 1 };
    });

    await disconnectTrello(
      input,
      fakeDb({ id: "member_1" }, connectedInstallation, deleteMany),
    );

    expect(deleteTrelloBoardWebhooks).toHaveBeenCalledWith("org_1", [
      "webhook_1",
      "webhook_2",
    ]);
    expect(calls).toEqual(["webhooks", "installation"]);
  });

  it("drops the installation without a Trello call while the grant is dead", async () => {
    getFullOrganization.mockResolvedValue({ id: "org_1" });
    const db = fakeDb(
      { id: "member_1" },
      {
        healthState: "reconnect_required",
        projectLinks: [{ webhookId: "webhook_1" }],
      },
    );

    await disconnectTrello(input, db);

    expect(deleteTrelloBoardWebhooks).not.toHaveBeenCalled();
    expect(db.trelloInstallation.deleteMany).toHaveBeenCalled();
  });
});
