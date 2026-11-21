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

// The card position an Issue link records at its last convergence: the list
// it sits in and whether it is archived. Only the card itself knows the list it
// was archived from, so inbound reads it back from Trello.
export type TrelloCardState = { listId: string; archived: boolean };

// One position may mirror several Statuses (ADR-0025). The complete mark is
// never read: the list is the only inbound signal.
export function isTrelloCardMirroring(
  card: TrelloCardState,
  status: FeedbackStatus,
  mapping: TrelloListMapping,
): boolean {
  if (card.archived) {
    // Archiving a resolved card tidies the board, so it still mirrors resolved.
    return (
      status === "closed" ||
      (status === "resolved" && card.listId === mapping.resolvedListId)
    );
  }
  if (status === "closed") return false;

  // An unmapped list ("QA", "Blocked") says nothing, so it contradicts no open
  // Status.
  const listStatus = mappedListStatus(card.listId, mapping);
  return !listStatus || listStatus === status;
}

// Null when the position names no Status: an unmapped list, or a card
// archived from the resolved list.
export function feedbackStatusFromTrelloCard(
  card: TrelloCardState,
  mapping: TrelloListMapping,
): FeedbackStatus | null {
  return card.archived
    ? archivedCardStatus(card.listId, mapping)
    : mappedListStatus(card.listId, mapping);
}

// In progress on a board with no In progress list leaves the card where it
// is, and that position counts as converged (ADR-0024).
export function leavesTrelloCardInPlace(
  status: FeedbackStatus,
  mapping: TrelloListMapping,
) {
  return status === "in_progress" && !mapping.inProgressListId;
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
