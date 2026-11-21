import { rethrowDomainErrorsAsNonRetriable } from "@/server/errors/non-retriable";
import { FeedbackStatusEnum } from "@/app/_domains/feedback";
import { formatTrelloCardName } from "../../_helpers/trello/format-card-description";
import {
  isTrelloCardMirroring,
  leavesTrelloCardInPlace,
} from "../../_helpers/trello/status-mapping";
import { createTrelloCardCover } from "./create-trello-card-cover";
import {
  getTrelloCardDescription,
  trelloCardFeedbackInclude,
} from "./get-trello-card-description";
import { prismaStatusConvergence } from "../_prisma-status-convergence";
import { convergeTracker } from "../converge-tracker";
import { trelloTrackerWriter } from "./_trello-tracker-adapter";
import { refreshTrelloLinkHealth } from "./refresh-trello-link-health";
import { createCard } from "./trello-client";
import { withTrelloAccessToken } from "./token-access";
import { prisma } from "@workspace/db";
import { inngest } from "@/server/inngest";
import { trelloCardCreateRequestedEvent } from "@/server/inngest/events";

export const createTrelloCard = inngest.createFunction(
  {
    id: "create-trello-card",
    retries: 3,
    concurrency: { key: "event.data.feedbackId", limit: 1 },
    // Trello allows 100 requests per 10 seconds per token. A card costs a
    // few calls (the link health check, creation, then its Screenshot), so
    // 20 cards leave headroom for the Status sync and the pickers on the
    // same token.
    throttle: { key: "event.data.installationId", limit: 20, period: "10s" },
    triggers: [{ event: trelloCardCreateRequestedEvent }],
  },
  async ({ event, step }) => {
    const { feedbackId, installationId } = event.data;

    const feedback = await readFeedback(feedbackId);

    if (!feedback) return { skipped: "feedback_not_found" };
    // Handler-level idempotency: a re-emitted request never makes a second card.
    if (feedback.trelloIssueLink) {
      return { skipped: "trello_card_already_exists" };
    }

    const link = feedback.project.trelloLink;
    // Unlinked, or relinked through another Installation, since the request.
    if (!link || link.trelloInstallationId !== installationId) {
      return { skipped: "no_trello_link" };
    }

    // An unhealthy link suspends card creation, by hand or not, so a card
    // never lands in an archived list or a dead board.
    const healthIssue = await step.run("refresh-link-health", () =>
      refreshTrelloLinkHealth(link.id).catch(rethrowDomainErrorsAsNonRetriable),
    );

    if (healthIssue) {
      return { skipped: "trello_link_unhealthy", reason: healthIssue };
    }

    const description = await getTrelloCardDescription(feedback);

    const organizationId = link.trelloInstallation.organizationId;

    // A step, so a retry after a failed write below reuses the card instead
    // of creating a second one. The cover upload shares it because it never
    // throws, and a second step would replay the idempotency check above
    // once the Issue link exists.
    const { card, cover } = await step.run("create-card", async () => {
      const card = await withTrelloAccessToken(organizationId, (token) =>
        createCard(token, {
          listId: link.newListId,
          name: formatTrelloCardName(feedback.comment),
          description,
          labelIds: link.defaultLabelIds,
        }),
      ).catch(rethrowDomainErrorsAsNonRetriable);

      const cover = await createTrelloCardCover({
        organizationId,
        cardId: card.id,
        screenshot: feedback.screenshot,
      });

      return { card, cover };
    });

    const status = FeedbackStatusEnum.parse(feedback.status);
    const position = { listId: card.idList, archived: card.closed };
    // A Feedback already past `new` starts pending (ADR-0025), unless its
    // Status leaves the card where it was created.
    const mirrored =
      isTrelloCardMirroring(position, status, link) ||
      (leavesTrelloCardInPlace(status, link) && !card.closed);

    await prisma.feedbackTrelloIssueLink.create({
      data: {
        feedbackId: feedback.id,
        projectTrelloLinkId: link.id,
        cardId: card.id,
        cardShortLink: card.shortLink,
        cardUrl: card.url,
        listId: card.idList,
        archived: card.closed,
        mirroredStatus: mirrored ? status : null,
      },
    });

    if (!mirrored) {
      await convergeTracker(
        { feedbackId: feedback.id },
        trelloTrackerWriter(prisma),
        prismaStatusConvergence(prisma, { awaitEvents: true }),
      );
    }

    return { cardId: card.id, cardShortLink: card.shortLink, cover };
  },
);

function readFeedback(feedbackId: string) {
  return prisma.feedback.findUnique({
    where: { id: feedbackId },
    include: {
      project: {
        include: {
          trelloLink: { include: { trelloInstallation: true } },
        },
      },
      ...trelloCardFeedbackInclude,
      screenshot: {
        select: { key: true, filename: true, mimeType: true, size: true },
      },
      trelloIssueLink: { select: { id: true } },
    },
  });
}
