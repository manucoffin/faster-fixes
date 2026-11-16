import { describe, expect, it } from "vitest";
import {
  resolveTrelloCardWrites,
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
