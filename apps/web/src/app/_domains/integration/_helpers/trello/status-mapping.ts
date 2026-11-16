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

// The card as re-read from Trello, never from the webhook payload: only the
// card itself knows the list it was archived from. Null when Trello has no
// such card.
export type TrelloCardState = {
  boardId: string;
  listId: string;
  closed: boolean;
} | null;

export type TrelloInboundDecision =
  | { type: "detach" }
  | { type: "none" }
  | { type: "set_status"; status: FeedbackStatus };

// The complete mark is never read: the list is the only inbound signal.
export function resolveFeedbackDecisionFromCard(
  card: TrelloCardState,
  link: TrelloListMapping & { boardId: string },
  currentStatus: FeedbackStatus,
): TrelloInboundDecision {
  // Faster Fixes never follows a card outside the linked board.
  if (!card || card.boardId !== link.boardId) return { type: "detach" };

  const status = card.closed
    ? archivedCardStatus(card.listId, link)
    : mappedListStatus(card.listId, link);

  if (!status || status === currentStatus) return { type: "none" };
  return { type: "set_status", status };
}

// Trello teams archive finished cards to tidy the board, so archiving from the
// resolved list keeps the Feedback resolved.
function archivedCardStatus(
  listId: string,
  mapping: TrelloListMapping,
): FeedbackStatus | null {
  return listId === mapping.resolvedListId ? null : "closed";
}

function mappedListStatus(
  listId: string,
  mapping: TrelloListMapping,
): FeedbackStatus | null {
  if (listId === mapping.newListId) return "new";
  if (listId === mapping.inProgressListId) return "in_progress";
  if (listId === mapping.resolvedListId) return "resolved";
  return null;
}
