import { describe, expect, it } from "vitest";
import {
  feedbackStatusFromTrelloCard,
  isTrelloCardMirroring,
  leavesTrelloCardInPlace,
  resolveTrelloCardWrites,
  type TrelloCardState,
  type TrelloCardWrites,
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

const openIn = (listId: string): TrelloCardState => ({
  listId,
  archived: false,
});
const archivedIn = (listId: string): TrelloCardState => ({
  listId,
  archived: true,
});

describe("isTrelloCardMirroring", () => {
  const rows: Array<{
    name: string;
    card: TrelloCardState;
    mapping?: TrelloListMapping;
    mirrors: FeedbackStatus[];
  }> = [
    {
      name: "an open card in the new list mirrors new",
      card: openIn("list_new"),
      mirrors: ["new"],
    },
    {
      name: "an open card in the in_progress list mirrors in_progress",
      card: openIn("list_in_progress"),
      mirrors: ["in_progress"],
    },
    {
      name: "an open card in the resolved list mirrors resolved",
      card: openIn("list_resolved"),
      mirrors: ["resolved"],
    },
    {
      name: "an open card in an unmapped list mirrors every open Status",
      card: openIn("list_qa"),
      mirrors: ["new", "in_progress", "resolved"],
    },
    {
      name: "an open card left in an unmapped list mirrors in_progress on a board with no in_progress list",
      card: openIn("list_qa"),
      mapping: withoutInProgress,
      mirrors: ["new", "in_progress", "resolved"],
    },
    {
      name: "the new list keeps naming new on a board with no in_progress list, so a move there applies",
      card: openIn("list_new"),
      mapping: withoutInProgress,
      mirrors: ["new"],
    },
    {
      name: "a card archived from the resolved list mirrors resolved and Archived",
      card: archivedIn("list_resolved"),
      mirrors: ["resolved", "closed"],
    },
    {
      name: "a card archived from any other list mirrors Archived only",
      card: archivedIn("list_new"),
      mirrors: ["closed"],
    },
    {
      name: "a card archived from an unmapped list mirrors Archived only",
      card: archivedIn("list_qa"),
      mirrors: ["closed"],
    },
  ];

  const statuses: FeedbackStatus[] = [
    "new",
    "in_progress",
    "resolved",
    "closed",
  ];

  it.each(rows)("$name", ({ card, mapping: rowMapping, mirrors }) => {
    const mirrored = statuses.filter((status) =>
      isTrelloCardMirroring(card, status, rowMapping ?? mapping),
    );
    expect(mirrored).toEqual(mirrors);
  });
});

describe("feedbackStatusFromTrelloCard", () => {
  const rows: Array<{
    name: string;
    card: TrelloCardState;
    mapping?: TrelloListMapping;
    status: FeedbackStatus | null;
  }> = [
    {
      name: "the new list implies new",
      card: openIn("list_new"),
      status: "new",
    },
    {
      name: "the in_progress list implies in_progress",
      card: openIn("list_in_progress"),
      status: "in_progress",
    },
    {
      name: "the resolved list implies resolved",
      card: openIn("list_resolved"),
      status: "resolved",
    },
    {
      name: "an unmapped list implies no Status",
      card: openIn("list_qa"),
      status: null,
    },
    {
      name: "the old in_progress list is unmapped when the link maps none",
      card: openIn("list_in_progress"),
      mapping: withoutInProgress,
      status: null,
    },
    {
      name: "a card archived from the resolved list implies no Status",
      card: archivedIn("list_resolved"),
      status: null,
    },
    {
      name: "a card archived from the new list implies Archived",
      card: archivedIn("list_new"),
      status: "closed",
    },
    {
      name: "a card archived from an unmapped list implies Archived",
      card: archivedIn("list_qa"),
      status: "closed",
    },
  ];

  it.each(rows)("$name", ({ card, mapping: rowMapping, status }) => {
    expect(feedbackStatusFromTrelloCard(card, rowMapping ?? mapping)).toBe(
      status,
    );
  });
});

describe("leavesTrelloCardInPlace", () => {
  it("leaves the card in place for in_progress on a board with no in_progress list", () => {
    expect(leavesTrelloCardInPlace("in_progress", withoutInProgress)).toBe(
      true,
    );
  });

  it("moves the card for in_progress when the board maps a list", () => {
    expect(leavesTrelloCardInPlace("in_progress", mapping)).toBe(false);
  });

  it("moves the card for every other Status", () => {
    expect(leavesTrelloCardInPlace("new", withoutInProgress)).toBe(false);
  });
});
