// The health of a Project link, stored verbatim in
// ProjectTrelloLink.linkHealthIssue. An unhealthy link suspends card creation
// so a card never lands in an archived list or a dead board. It is never
// Reconnect required: the grant itself is fine.

import type { TrelloListMapping } from "./status-mapping";

export type TrelloLinkHealthIssue =
  | "stale_list"
  | "board_closed"
  | "board_unreachable";

// The linked board as re-read from Trello, with every list, archived included.
// `null` when Trello no longer lets the Installation reach it.
export type TrelloBoardState = {
  closed: boolean;
  lists: { id: string; closed: boolean }[];
} | null;

export function resolveTrelloLinkHealth(
  board: TrelloBoardState,
  mapping: TrelloListMapping,
): TrelloLinkHealthIssue | null {
  if (!board) return "board_unreachable";
  if (board.closed) return "board_closed";

  const openListIds = new Set(
    board.lists.filter((list) => !list.closed).map((list) => list.id),
  );
  const mappedListIds = [
    mapping.newListId,
    mapping.inProgressListId,
    mapping.resolvedListId,
  ].filter((listId): listId is string => listId !== null);

  return mappedListIds.every((listId) => openListIds.has(listId))
    ? null
    : "stale_list";
}
