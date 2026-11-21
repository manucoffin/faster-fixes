import { prisma } from "@workspace/db";
import { rethrowDomainErrorsAsNonRetriable } from "@/server/errors/non-retriable";
import {
  feedbackStatusFromTrelloCard,
  isTrelloCardMirroring,
  leavesTrelloCardInPlace,
  resolveTrelloCardWrites,
  type TrelloListMapping,
} from "../../_helpers/trello/status-mapping";
import type { TrackerAdapter } from "../apply-observed-issue-state";
import type { TrackerWriter } from "../converge-tracker";
import { getCard, updateCard } from "./trello-client";
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

/** Trello behind Converge a Tracker: each card writes through its Project link's lists. */
export function trelloTrackerWriter(
  db: typeof prisma = prisma,
): TrackerWriter<"trello"> {
  return {
    tracker: "trello",
    async writeStatus({ id, issueState }, status) {
      const { cardId, projectTrelloLink: link } =
        await db.feedbackTrelloIssueLink.findUniqueOrThrow({
          where: { id },
          select: {
            cardId: true,
            projectTrelloLink: {
              select: {
                newListId: true,
                inProgressListId: true,
                resolvedListId: true,
                trelloInstallation: { select: { organizationId: true } },
              },
            },
          },
        });

      // ADR-0024: an open card stays where it is, but an archived one is
      // still brought back to the board.
      if (leavesTrelloCardInPlace(status, link) && !issueState.archived) {
        return "nothing_to_write";
      }

      const card = await withTrelloAccessToken(
        link.trelloInstallation.organizationId,
        (token) =>
          updateCard(token, cardId, resolveTrelloCardWrites(status, link)),
      ).catch((error: unknown) => {
        if (error instanceof TrelloRequestError && error.status === 404) {
          return null;
        }
        return rethrowDomainErrorsAsNonRetriable(error);
      });
      if (!card) return "missing";

      return { state: { listId: card.idList, archived: card.closed } };
    },
  };
}
