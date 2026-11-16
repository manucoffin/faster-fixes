import { rethrowDomainErrorsAsNonRetriable } from "@/server/errors/non-retriable";
import { resolveTrelloCardWrites } from "../../_helpers/trello/status-mapping";
import { updateCard } from "./trello-client";
import { TrelloRequestError } from "./trello-request-error";
import { withTrelloAccessToken } from "./token-access";
import { prisma } from "@workspace/db";
import { inngest } from "@/server/inngest";
import { feedbackStatusChangedEvent } from "@/server/inngest/events";

const SYNC_LOOP_WINDOW_MS = 30_000;

export const syncFeedbackStatusToTrello = inngest.createFunction(
  {
    id: "sync-feedback-status-to-trello",
    retries: 3,
    concurrency: { key: "event.data.feedbackId", limit: 1 },
    triggers: [{ event: feedbackStatusChangedEvent }],
  },
  async ({ event }) => {
    const { feedbackId, newStatus, origin } = event.data;

    // If this status change originated in Trello, don't echo back.
    if (origin === "trello") return { skipped: "origin_trello" };

    const issueLink = await prisma.feedbackTrelloIssueLink.findUnique({
      where: { feedbackId },
      include: {
        projectTrelloLink: { include: { trelloInstallation: true } },
      },
    });

    if (!issueLink) return { skipped: "no_trello_issue_link" };

    if (
      issueLink.lastSyncSource === "trello" &&
      issueLink.lastSyncAt &&
      Date.now() - issueLink.lastSyncAt.getTime() < SYNC_LOOP_WINDOW_MS
    ) {
      return { skipped: "sync_loop_prevention" };
    }

    const link = issueLink.projectTrelloLink;
    const writes = resolveTrelloCardWrites(newStatus, link);

    const card = await withTrelloAccessToken(
      link.trelloInstallation.organizationId,
      (token) => updateCard(token, issueLink.cardId, writes),
    ).catch((error: unknown) => {
      // A card deleted in Trello detaches its Issue link and the Status stays,
      // so the Feedback can get a new card.
      if (error instanceof TrelloRequestError && error.status === 404) {
        return null;
      }
      return rethrowDomainErrorsAsNonRetriable(error);
    });

    if (!card) {
      await prisma.feedbackTrelloIssueLink.delete({
        where: { id: issueLink.id },
      });
      return { skipped: "trello_card_not_found" };
    }

    await prisma.feedbackTrelloIssueLink.update({
      where: { id: issueLink.id },
      data: {
        listId: card.idList,
        archived: card.closed,
        lastSyncSource: "app",
        lastSyncAt: new Date(),
      },
    });

    return { cardId: card.id, listId: card.idList, archived: card.closed };
  },
);
