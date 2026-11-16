import { FeedbackStatusEnum } from "@/app/_domains/feedback";
import { rethrowDomainErrorsAsNonRetriable } from "@/server/errors/non-retriable";
import { resolveFeedbackDecisionFromCard } from "../../_helpers/trello/status-mapping";
import { getCard } from "./trello-client";
import { TrelloRequestError } from "./trello-request-error";
import { withTrelloAccessToken } from "./token-access";
import { prisma } from "@workspace/db";
import { inngest } from "@/server/inngest";
import {
  buildEvent,
  feedbackStatusChangedEvent,
  trelloWebhookCardEvent,
} from "@/server/inngest/events";

const SYNC_LOOP_WINDOW_MS = 30_000;

export const syncTrelloCardStatus = inngest.createFunction(
  {
    id: "sync-trello-card-status",
    retries: 3,
    concurrency: { key: "event.data.cardId", limit: 1 },
    triggers: [{ event: trelloWebhookCardEvent }],
  },
  async ({ event }) => {
    const { projectTrelloLinkId, cardId } = event.data;

    // Scoped to the link whose webhook delivered it, so a payload naming a
    // card of another tenant finds no Issue link.
    const issueLink = await prisma.feedbackTrelloIssueLink.findFirst({
      where: { cardId, projectTrelloLinkId },
      include: {
        feedback: { select: { status: true } },
        projectTrelloLink: { include: { trelloInstallation: true } },
      },
    });

    if (!issueLink) return { skipped: "no_matching_issue_link" };

    const link = issueLink.projectTrelloLink;

    // Re-read before apply: the payload said something changed, Trello says
    // what, including the list an archived card sits in.
    const card = await withTrelloAccessToken(
      link.trelloInstallation.organizationId,
      (token) => getCard(token, cardId),
    ).catch((error: unknown) => {
      if (error instanceof TrelloRequestError && error.status === 404) {
        return null;
      }
      return rethrowDomainErrorsAsNonRetriable(error);
    });

    const decision = resolveFeedbackDecisionFromCard(
      card && {
        boardId: card.idBoard,
        listId: card.idList,
        closed: card.closed,
      },
      link,
      FeedbackStatusEnum.parse(issueLink.feedback.status),
    );

    // Detaching rather than cascading to the Feedback keeps its Status and lets
    // it get a new card.
    if (decision.type === "detach" || !card) {
      await prisma.feedbackTrelloIssueLink.delete({
        where: { id: issueLink.id },
      });
      return { feedbackId: issueLink.feedbackId, detached: true };
    }

    // Our own card write comes back as a delivery; inside the window, the card
    // may not yet reflect a Status that changed again since.
    if (
      issueLink.lastSyncSource === "app" &&
      issueLink.lastSyncAt &&
      Date.now() - issueLink.lastSyncAt.getTime() < SYNC_LOOP_WINDOW_MS
    ) {
      return { skipped: "sync_loop_prevention" };
    }

    const cardState = { listId: card.idList, archived: card.closed };

    if (decision.type === "none") {
      await prisma.feedbackTrelloIssueLink.update({
        where: { id: issueLink.id },
        data: cardState,
      });
      return { skipped: "status_unchanged" };
    }

    await prisma.$transaction([
      prisma.feedback.update({
        where: { id: issueLink.feedbackId },
        data: { status: decision.status },
      }),
      prisma.feedbackTrelloIssueLink.update({
        where: { id: issueLink.id },
        data: {
          ...cardState,
          lastSyncSource: "trello",
          lastSyncAt: new Date(),
        },
      }),
    ]);

    // Converge the other Trackers on the Feedback. `origin: "trello"` stops
    // this from echoing straight back to the card it came from.
    await inngest.send(
      buildEvent(feedbackStatusChangedEvent, {
        feedbackId: issueLink.feedbackId,
        newStatus: decision.status,
        origin: "trello",
        actor: "tracker",
      }),
    );

    return { feedbackId: issueLink.feedbackId, newStatus: decision.status };
  },
);
