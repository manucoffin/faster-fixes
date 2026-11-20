import { inngest } from "@/server/inngest";
import {
  buildEvent,
  feedbackStatusChangedEvent,
} from "@/server/inngest/events";
import { prisma } from "@workspace/db";
import { FeedbackStatusEnum } from "@/app/_domains/feedback";
import type { IssueLinkUpdate, StatusConvergence } from "./update-status";

/**
 * The production dependencies of Status convergence: Prisma and Inngest.
 * `awaitEvents` is for Inngest functions, whose send must finish before they
 * return and whose retries cover a failed send.
 */
export function prismaStatusConvergence(
  db: typeof prisma = prisma,
  { awaitEvents = false }: { awaitEvents?: boolean } = {},
): StatusConvergence {
  return {
    store: {
      async writeStatuses({ feedbackIds, status, from, issueLink }) {
        const writeFeedbacks = db.feedback.updateManyAndReturn({
          where: {
            id: { in: feedbackIds },
            ...(from && { status: { in: from } }),
          },
          data: { status },
          select: { id: true },
        });

        const written = issueLink
          ? (
              await db.$transaction([
                writeFeedbacks,
                updateIssueLink(db, issueLink),
              ])
            )[0]
          : await writeFeedbacks;

        return written.map((feedback) => feedback.id);
      },
      async findIssueLink({ issueId, installationId }) {
        // Scoped to the Installation the delivery token identified, so a
        // payload naming an issue id of another tenant finds no link.
        const link = await db.feedbackJiraIssueLink.findFirst({
          where: {
            issueId,
            projectJiraLink: { jiraInstallationId: installationId },
          },
          select: {
            id: true,
            feedbackId: true,
            mirroredStatus: true,
            issueStatusCategory: true,
            feedback: { select: { status: true } },
          },
        });
        if (!link) return null;

        return {
          tracker: "jira",
          id: link.id,
          feedbackId: link.feedbackId,
          feedbackStatus: FeedbackStatusEnum.parse(link.feedback.status),
          mirroredStatus: FeedbackStatusEnum.nullable()
            .catch(null)
            .parse(link.mirroredStatus),
          issueState: { issueStatusCategory: link.issueStatusCategory },
        };
      },
      async refreshIssueState({ id }, issueState) {
        await db.feedbackJiraIssueLink.update({
          where: { id },
          data: issueState,
        });
      },
      async detachIssueLink({ id }) {
        await db.feedbackJiraIssueLink.delete({ where: { id } });
      },
    },
    async sendEvents(events) {
      // One event per Feedback so each Tracker sync gets its own retries.
      const sent = inngest.send(
        events.map((data) => buildEvent(feedbackStatusChangedEvent, data)),
      );
      if (awaitEvents) {
        await sent;
        return;
      }
      // Fire-and-forget: a failed send never fails a User's Status change.
      sent.catch(() => {});
    },
  };
}

function updateIssueLink(
  db: typeof prisma,
  { tracker, id, data }: IssueLinkUpdate,
) {
  // The time windows still read these until ADR-0025's decisions replace them
  // for every Tracker and direction.
  const sync = { lastSyncSource: tracker, lastSyncAt: new Date() };

  switch (tracker) {
    case "github":
      return db.feedbackIssueLink.update({
        where: { id },
        data: { ...data, ...sync },
      });
    case "linear":
      return db.feedbackLinearIssueLink.update({
        where: { id },
        data: { ...data, ...sync },
      });
    case "jira":
      return db.feedbackJiraIssueLink.update({
        where: { id },
        data: { ...data, ...sync },
      });
    case "trello":
      return db.feedbackTrelloIssueLink.update({
        where: { id },
        data: { ...data, ...sync },
      });
  }
}
