import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import { createTrelloCardForFeedback } from "./create-trello-card-for-feedback";

const send = vi
  .fn<(payload: unknown) => Promise<void>>()
  .mockResolvedValue(undefined);

vi.mock("@/server/inngest", () => ({
  inngest: { send: (payload: unknown) => send(payload) },
}));

type FakeDb = NonNullable<Parameters<typeof createTrelloCardForFeedback>[1]>;

type FakeFeedback = {
  project: { organizationId: string; trelloLink: { id: string } | null };
  trelloIssueLink: { id: string } | null;
};

function fakeDb(
  feedback: FakeFeedback | null,
  membership: { id: string } | null,
) {
  return {
    feedback: { findUnique: vi.fn().mockResolvedValue(feedback) },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
  } as unknown as FakeDb;
}

const linked: FakeFeedback = {
  project: { organizationId: "org_1", trelloLink: { id: "link_1" } },
  trelloIssueLink: null,
};

const member = { id: "member_1" };
const input = { feedbackId: "feedback_1", userId: "user_1" };

describe("createTrelloCardForFeedback", () => {
  it("reports an unknown feedback as not found", async () => {
    await expect(
      createTrelloCardForFeedback(input, fakeDb(null, null)),
    ).rejects.toThrow(new NotFoundError("Feedback not found."));
  });

  it("refuses a caller who is not a member of the project's organization", async () => {
    await expect(
      createTrelloCardForFeedback(input, fakeDb(linked, null)),
    ).rejects.toThrow(new ForbiddenError("Access denied."));
  });

  it("refuses a feedback that already has a Trello card", async () => {
    const db = fakeDb({ ...linked, trelloIssueLink: { id: "card_1" } }, member);

    await expect(createTrelloCardForFeedback(input, db)).rejects.toThrow(
      new ConflictError("A Trello card already exists for this feedback."),
    );
  });

  it("refuses a project with no linked Trello board", async () => {
    const db = fakeDb(
      { ...linked, project: { organizationId: "org_1", trelloLink: null } },
      member,
    );

    await expect(createTrelloCardForFeedback(input, db)).rejects.toThrow(
      new BadRequestError("No Trello board linked to this project."),
    );
  });

  it("queues the card creation for a member caller", async () => {
    send.mockClear();

    await expect(
      createTrelloCardForFeedback(input, fakeDb(linked, member)),
    ).resolves.toEqual({ queued: true });
    expect(send).toHaveBeenCalledWith({
      name: "feedback/integration-issue-requested",
      data: { feedbackId: "feedback_1", target: "trello" },
    });
  });
});
