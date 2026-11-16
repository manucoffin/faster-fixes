import { describe, expect, it } from "vitest";
import {
  resolveFeedbackDecisionFromCard,
  resolveTrelloCardWrites,
  type TrelloCardState,
  type TrelloCardWrites,
  type TrelloInboundDecision,
  type TrelloListMapping,
} from "./status-mapping";
import type { FeedbackStatus } from "@/app/_domains/feedback";

const mapping: TrelloListMapping = {
  newListId: "list_new",
  inProgressListId: "list_in_progress",
  resolvedListId: "list_resolved",
};

const withoutInProgress: TrelloListMapping = {
  ...mapping,
  inProgressListId: null,
};

describe("resolveTrelloCardWrites", () => {
  const rows: Array<{
    name: string;
    status: FeedbackStatus;
    mapping: TrelloListMapping;
    writes: TrelloCardWrites;
  }> = [
    {
      name: "moves a new Feedback to the new list, open and not complete",
      status: "new",
      mapping,
      writes: { listId: "list_new", closed: false, dueComplete: false },
    },
    {
      name: "moves an in_progress Feedback to the in_progress list",
      status: "in_progress",
      mapping,
      writes: { listId: "list_in_progress", closed: false, dueComplete: false },
    },
    {
      name: "leaves the list alone for in_progress when no list is mapped",
      status: "in_progress",
      mapping: withoutInProgress,
      writes: { listId: undefined, closed: false, dueComplete: false },
    },
    {
      name: "moves a resolved Feedback to the resolved list and marks it complete",
      status: "resolved",
      mapping,
      writes: { listId: "list_resolved", closed: false, dueComplete: true },
    },
    {
      name: "archives the card of an Archived Feedback and leaves its list",
      status: "closed",
      mapping,
      writes: { closed: true },
    },
  ];

  it.each(rows)("$name", ({ status, mapping, writes }) => {
    expect(resolveTrelloCardWrites(status, mapping)).toEqual(writes);
  });

  it("unarchives a restored Feedback into the new list", () => {
    const writes = resolveTrelloCardWrites("new", mapping);

    expect(writes.closed).toBe(false);
    expect(writes.listId).toBe("list_new");
  });
});

describe("resolveFeedbackDecisionFromCard", () => {
  const link = { ...mapping, boardId: "board" };
  const linkWithoutInProgress = { ...withoutInProgress, boardId: "board" };

  const openIn = (listId: string): TrelloCardState => ({
    boardId: "board",
    listId,
    closed: false,
  });
  const archivedIn = (listId: string): TrelloCardState => ({
    boardId: "board",
    listId,
    closed: true,
  });

  const rows: Array<{
    name: string;
    card: TrelloCardState;
    link?: typeof link;
    currentStatus: FeedbackStatus;
    decision: TrelloInboundDecision;
  }> = [
    {
      name: "detaches the Issue link of a card Trello no longer has",
      card: null,
      currentStatus: "in_progress",
      decision: { type: "detach" },
    },
    {
      name: "detaches the Issue link of a card moved to another board",
      card: { boardId: "other_board", listId: "list_new", closed: false },
      currentStatus: "in_progress",
      decision: { type: "detach" },
    },
    {
      name: "leaves a Feedback resolved when its card is archived from the resolved list",
      card: archivedIn("list_resolved"),
      currentStatus: "resolved",
      decision: { type: "none" },
    },
    {
      name: "changes nothing for a card archived from the resolved list, whatever the Status",
      card: archivedIn("list_resolved"),
      currentStatus: "new",
      decision: { type: "none" },
    },
    {
      name: "archives the Feedback of a card archived from the new list",
      card: archivedIn("list_new"),
      currentStatus: "new",
      decision: { type: "set_status", status: "closed" },
    },
    {
      name: "archives the Feedback of a card archived from an unmapped list",
      card: archivedIn("list_qa"),
      currentStatus: "in_progress",
      decision: { type: "set_status", status: "closed" },
    },
    {
      name: "changes nothing for an archived card whose Feedback is already Archived",
      card: archivedIn("list_new"),
      currentStatus: "closed",
      decision: { type: "none" },
    },
    {
      name: "sets new for a card moved back into the new list",
      card: openIn("list_new"),
      currentStatus: "resolved",
      decision: { type: "set_status", status: "new" },
    },
    {
      name: "sets in_progress for a card moved into the in_progress list",
      card: openIn("list_in_progress"),
      currentStatus: "new",
      decision: { type: "set_status", status: "in_progress" },
    },
    {
      name: "sets resolved for a card moved into the resolved list",
      card: openIn("list_resolved"),
      currentStatus: "in_progress",
      decision: { type: "set_status", status: "resolved" },
    },
    {
      name: "gives an unarchived card's Feedback the Status of its mapped list",
      card: openIn("list_in_progress"),
      currentStatus: "closed",
      decision: { type: "set_status", status: "in_progress" },
    },
    {
      name: "changes nothing for a card already in the list of its Status",
      card: openIn("list_resolved"),
      currentStatus: "resolved",
      decision: { type: "none" },
    },
    {
      name: "changes nothing for a card moved into an unmapped list",
      card: openIn("list_qa"),
      currentStatus: "new",
      decision: { type: "none" },
    },
    {
      name: "treats the in_progress list as unmapped when the link maps none",
      card: openIn("list_in_progress"),
      link: linkWithoutInProgress,
      currentStatus: "new",
      decision: { type: "none" },
    },
  ];

  it.each(rows)("$name", ({ card, link: rowLink, currentStatus, decision }) => {
    expect(
      resolveFeedbackDecisionFromCard(card, rowLink ?? link, currentStatus),
    ).toEqual(decision);
  });
});
