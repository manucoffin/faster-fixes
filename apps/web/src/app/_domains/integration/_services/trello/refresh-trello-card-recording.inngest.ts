import { rethrowDomainErrorsAsNonRetriable } from "@/server/errors/non-retriable";
import {
  getTrelloCardDescription,
  trelloCardFeedbackInclude,
} from "./get-trello-card-description";
import { updateCardDescription } from "./trello-client";
import { TrelloRequestError } from "./trello-request-error";
import { withTrelloAccessToken } from "./token-access";
import { prisma } from "@workspace/db";
import { inngest } from "@/server/inngest";
import { feedbackRecordingAttachedEvent } from "@/server/inngest/events";

// A card created before its Recording arrived, past the wait or by hand,
// gets the link to the Recording player once the Recording is stored.
export const refreshTrelloCardRecording = inngest.createFunction(
  {
    id: "refresh-trello-card-recording",
    retries: 3,
    concurrency: { key: "event.data.feedbackId", limit: 1 },
    triggers: [{ event: feedbackRecordingAttachedEvent }],
  },
  async ({ event }) => {
    const feedback = await prisma.feedback.findUnique({
      where: { id: event.data.feedbackId },
      include: {
        ...trelloCardFeedbackInclude,
        trelloIssueLink: {
          include: {
            projectTrelloLink: { include: { trelloInstallation: true } },
          },
        },
      },
    });

    if (!feedback) return { skipped: "feedback_not_found" };
    // No card yet: one still waiting for this Recording is written with it.
    const issueLink = feedback.trelloIssueLink;
    if (!issueLink) return { skipped: "no_trello_issue_link" };

    const description = await getTrelloCardDescription(feedback);

    const card = await withTrelloAccessToken(
      issueLink.projectTrelloLink.trelloInstallation.organizationId,
      (token) => updateCardDescription(token, issueLink.cardId, description),
    ).catch((error: unknown) => {
      // A card deleted in Trello detaches its Issue link, as the Status sync does.
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

    return { cardId: card.id };
  },
);
