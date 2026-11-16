import { rethrowDomainErrorsAsNonRetriable } from "@/server/errors/non-retriable";
import {
  formatTrelloCardDescription,
  formatTrelloCardName,
} from "../../_helpers/trello/format-card-description";
import { buildFeedbackDashboardUrl } from "../../_helpers/build-feedback-dashboard-url";
import { refreshIssueRecording } from "../refresh-issue-recording";
import { refreshTrelloLinkHealth } from "./refresh-trello-link-health";
import { createCard } from "./trello-client";
import { withTrelloAccessToken } from "./token-access";
import type { CustomMetadata, DiagnosticTrail } from "@fasterfixes/core";
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

    const recording = await refreshIssueRecording(feedback);

    const description = formatTrelloCardDescription({
      id: feedback.id,
      comment: feedback.comment,
      pageUrl: feedback.pageUrl,
      selector: feedback.selector,
      clickX: feedback.clickX,
      clickY: feedback.clickY,
      browserName: feedback.browserName,
      browserVersion: feedback.browserVersion,
      os: feedback.os,
      viewportWidth: feedback.viewportWidth,
      viewportHeight: feedback.viewportHeight,
      reviewerName: feedback.reviewer.name,
      metadata: feedback.metadata as Record<string, unknown> | null,
      diagnosticTrail: feedback.diagnosticTrail as DiagnosticTrail | null,
      customMetadata: feedback.customMetadata as CustomMetadata | null,
      projectId: feedback.projectId,
      dashboardUrl: buildFeedbackDashboardUrl(feedback),
      videoId: feedback.videoId,
      videoTitle: feedback.video?.title,
      startMs: feedback.startMs,
      endMs: feedback.endMs,
      frameX: feedback.frameX,
      frameY: feedback.frameY,
      frameWidth: feedback.frameWidth,
      frameHeight: feedback.frameHeight,
      recording,
    });

    // A step, so a retry after a failed write below reuses the card instead
    // of creating a second one.
    const card = await step.run("create-card", () =>
      withTrelloAccessToken(link.trelloInstallation.organizationId, (token) =>
        createCard(token, {
          listId: link.newListId,
          name: formatTrelloCardName(feedback.comment),
          description,
          labelIds: link.defaultLabelIds,
        }),
      ).catch(rethrowDomainErrorsAsNonRetriable),
    );

    await prisma.feedbackTrelloIssueLink.create({
      data: {
        feedbackId: feedback.id,
        projectTrelloLinkId: link.id,
        cardId: card.id,
        cardShortLink: card.shortLink,
        cardUrl: card.url,
        listId: card.idList,
        archived: card.closed,
        lastSyncSource: "app",
        lastSyncAt: new Date(),
      },
    });

    return { cardId: card.id, cardShortLink: card.shortLink };
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
      reviewer: { select: { name: true } },
      video: { select: { title: true } },
      recording: { select: { key: true } },
      trelloIssueLink: { select: { id: true } },
    },
  });
}
