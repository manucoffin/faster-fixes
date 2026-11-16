import {
  resolveTrelloLinkHealth,
  type TrelloLinkHealthIssue,
} from "../../_helpers/trello/link-health";
import type { TrelloListMapping } from "../../_helpers/trello/status-mapping";
import { getBoardWithLists } from "./trello-client";
import { TrelloRequestError } from "./trello-request-error";
import { withTrelloAccessToken } from "./token-access";

/**
 * Re-reads the linked board and tells whether a card can still be created
 * where the link says. Only a board Trello says is gone (404) or out of reach
 * (403) counts as unhealthy: any other failure is rethrown untouched, so a
 * Trello outage never marks the link, and a 401 stays Reconnect required.
 */
export async function getTrelloLinkHealth(
  organizationId: string,
  link: TrelloListMapping & { boardId: string },
): Promise<TrelloLinkHealthIssue | null> {
  const board = await withTrelloAccessToken(organizationId, (accessToken) =>
    getBoardWithLists(accessToken, link.boardId),
  ).catch((error: unknown) => {
    if (
      error instanceof TrelloRequestError &&
      (error.status === 403 || error.status === 404)
    ) {
      return null;
    }
    throw error;
  });

  return resolveTrelloLinkHealth(board, link);
}

export type GetTrelloLinkHealthOutput = Awaited<
  ReturnType<typeof getTrelloLinkHealth>
>;
