import { findFeedbackWithAwaitedRecording } from "../find-feedback-with-awaited-recording";
import { prisma } from "@workspace/db";
import { inngest } from "@/server/inngest";
import {
  buildEvent,
  feedbackCreatedEvent,
  feedbackIntegrationIssueRequestedEvent,
  trelloCardCreateRequestedEvent,
} from "@/server/inngest/events";

/**
 * Decides whether a Feedback gets a Trello card and holds it back for its
 * Recording, then hands it to `create-trello-card`, which is throttled per
 * Installation. The split exists because the triggering events carry only the
 * Feedback, and a throttle key can only read the event.
 */
export const requestTrelloCard = inngest.createFunction(
  {
    id: "request-trello-card",
    retries: 3,
    triggers: [
      { event: feedbackCreatedEvent },
      {
        event: feedbackIntegrationIssueRequestedEvent,
        if: "event.data.target == 'trello'",
      },
    ],
  },
  async ({ event, step }) => {
    const { feedbackId } = event.data;

    const found = await readFeedback(feedbackId);

    if (!found) return { skipped: "feedback_not_found" };
    if (found.trelloIssueLink) return { skipped: "trello_card_already_exists" };

    const link = found.project.trelloLink;
    if (!link) return { skipped: "no_trello_link" };

    // Auto-create only gates `feedback/created`. Manual creation
    // (`feedback/integration-issue-requested`) bypasses the switch.
    const isManualTrigger =
      event.name === "feedback/integration-issue-requested";
    if (!isManualTrigger && !link.autoCreateIssues) {
      return { skipped: "auto_create_disabled" };
    }

    const feedback = await findFeedbackWithAwaitedRecording({
      event,
      step,
      feedback: found,
      readFeedback: () => readFeedback(feedbackId),
    });
    if (!feedback) return { skipped: "feedback_not_found" };
    if (feedback.trelloIssueLink) {
      return { skipped: "trello_card_already_exists" };
    }

    await step.sendEvent(
      "request-card-creation",
      buildEvent(trelloCardCreateRequestedEvent, {
        feedbackId,
        installationId: link.trelloInstallationId,
      }),
    );

    return { requested: feedbackId };
  },
);

function readFeedback(feedbackId: string) {
  return prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: {
      recording: { select: { key: true } },
      trelloIssueLink: { select: { id: true } },
      project: {
        select: {
          trelloLink: {
            select: { autoCreateIssues: true, trelloInstallationId: true },
          },
        },
      },
    },
  });
}
