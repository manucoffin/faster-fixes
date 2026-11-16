// The Status mapping of ADR 0024. Trello has no status primitive, so the lists
// the User mapped on the Project link are the only thing a Status converges to.

import type { FeedbackStatus } from "@/app/_domains/feedback";

export type TrelloListMapping = {
  newListId: string;
  inProgressListId: string | null;
  resolvedListId: string;
};

// The fields of a card update. An absent field is left as it is on Trello.
export type TrelloCardWrites = {
  listId?: string;
  closed: boolean;
  dueComplete?: boolean;
};

export function resolveTrelloCardWrites(
  status: FeedbackStatus,
  mapping: TrelloListMapping,
): TrelloCardWrites {
  switch (status) {
    case "new":
      return { listId: mapping.newListId, closed: false, dueComplete: false };
    case "in_progress":
      return {
        listId: mapping.inProgressListId ?? undefined,
        closed: false,
        dueComplete: false,
      };
    case "resolved":
      return {
        listId: mapping.resolvedListId,
        closed: false,
        dueComplete: true,
      };
    // Archived: the list it was archived from is what inbound sync reads, so
    // it stays put.
    case "closed":
      return { closed: true };
  }
}
