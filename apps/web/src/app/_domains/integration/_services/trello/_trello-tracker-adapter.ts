import { prisma } from "@workspace/db";
import { rethrowDomainErrorsAsNonRetriable } from "@/server/errors/non-retriable";
import {
  feedbackStatusFromTrelloCard,
  isTrelloCardMirroring,
  type TrelloListMapping,
} from "../../_helpers/trello/status-mapping";
import type { TrackerAdapter } from "../apply-observed-issue-state";
import { getCard } from "./trello-client";
import { TrelloRequestError } from "./trello-request-error";
import { withTrelloAccessToken } from "./token-access";

type TrelloProjectLink = TrelloListMapping & {
  boardId: string;
  organizationId: string;
};

/**
 * Trello behind Status convergence, for the cards of one Project link: Trello
 * has no status primitive, so the link's list mapping (ADR-0024) is the
 * mapping.
 */
export function trelloTrackerAdapter(
  { boardId, organizationId, ...mapping }: TrelloProjectLink,
  db: typeof prisma = prisma,
): TrackerAdapter<"trello"> {
  return {
    tracker: "trello",
    async readIssue({ id }) {
      const { cardId } = await db.feedbackTrelloIssueLink.findUniqueOrThrow({
        where: { id },
        select: { cardId: true },
      });

      // Only the card itself knows the list it was archived from.
      const card = await withTrelloAccessToken(organizationId, (token) =>
        getCard(token, cardId),
      ).catch((error: unknown) => {
        if (error instanceof TrelloRequestError && error.status === 404) {
          return null;
        }
        return rethrowDomainErrorsAsNonRetriable(error);
      });

      // Faster Fixes never follows a card outside the linked board.
      if (!card || card.idBoard !== boardId) return "missing";

      return { state: { listId: card.idList, archived: card.closed } };
    },
    isMirroring: (state, status) =>
      isTrelloCardMirroring(state, status, mapping),
    getImpliedStatus: (state) => feedbackStatusFromTrelloCard(state, mapping),
  };
}
