import { inngest } from "@/server/inngest";
import {
  buildEvent,
  feedbackStatusChangedEvent,
} from "@/server/inngest/events";
import { prisma } from "@workspace/db";
import { FeedbackStatusEnum } from "@/app/_domains/feedback";
import type { Prisma } from "@workspace/db/types";
import type {
  IssueLinkUpdate,
  MirroredIssueLink,
  StatusConvergence,
} from "./update-status";

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
      findIssueLink(reference) {
        switch (reference.tracker) {
          case "jira":
            // Scoped to the Installation the delivery token identified, so a
            // payload naming an issue id of another tenant finds no link.
            return findJiraIssueLink(db, {
              issueId: reference.issueId,
              projectJiraLink: {
                jiraInstallationId: reference.installationId,
              },
            });
          case "github":
            return findGitHubIssueLink(db, {
              issueNumber: reference.issueNumber,
              projectGitHubLink: { repoFullName: reference.repoFullName },
            });
          case "linear":
            // Scoped to the Installation the signed delivery named, as Jira's is.
            return findLinearIssueLink(db, {
              issueId: reference.issueId,
              projectLinearLink: {
                linearInstallationId: reference.installationId,
              },
            });
          case "trello":
            // Scoped to the link whose webhook delivered it, so a payload
            // naming a card of another tenant finds no Issue link.
            return findTrelloIssueLink(db, {
              cardId: reference.cardId,
              projectTrelloLinkId: reference.projectTrelloLinkId,
            });
        }
      },
      findFeedbackIssueLink({ tracker, feedbackId }) {
        const where = { feedbackId };
        switch (tracker) {
          case "jira":
            return findJiraIssueLink(db, where);
          case "github":
            return findGitHubIssueLink(db, where);
          case "linear":
            return findLinearIssueLink(db, where);
          case "trello":
            return findTrelloIssueLink(db, where);
        }
      },
      async recordConvergence(update) {
        await updateIssueLink(db, update);
      },
      async refreshIssueState(refresh) {
        const where = { id: refresh.id };
        switch (refresh.tracker) {
          case "jira":
            await db.feedbackJiraIssueLink.update({
              where,
              data: refresh.issueState,
            });
            return;
          case "github":
            await db.feedbackIssueLink.update({
              where,
              data: refresh.issueState,
            });
            return;
          case "linear":
            await db.feedbackLinearIssueLink.update({
              where,
              data: refresh.issueState,
            });
            return;
          case "trello":
            await db.feedbackTrelloIssueLink.update({
              where,
              data: refresh.issueState,
            });
            return;
        }
      },
      async detachIssueLink({ tracker, id }) {
        switch (tracker) {
          case "jira":
            await db.feedbackJiraIssueLink.delete({ where: { id } });
            return;
          case "github":
            await db.feedbackIssueLink.delete({ where: { id } });
            return;
          case "linear":
            await db.feedbackLinearIssueLink.delete({ where: { id } });
            return;
          case "trello":
            await db.feedbackTrelloIssueLink.delete({ where: { id } });
            return;
        }
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

const parseMirroredStatus = FeedbackStatusEnum.nullable().catch(null).parse;

async function findJiraIssueLink(
  db: typeof prisma,
  where: Prisma.FeedbackJiraIssueLinkWhereInput,
): Promise<MirroredIssueLink<"jira"> | null> {
  const link = await db.feedbackJiraIssueLink.findFirst({
    where,
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
    mirroredStatus: parseMirroredStatus(link.mirroredStatus),
    issueState: { issueStatusCategory: link.issueStatusCategory },
  };
}

async function findGitHubIssueLink(
  db: typeof prisma,
  where: Prisma.FeedbackIssueLinkWhereInput,
): Promise<MirroredIssueLink<"github"> | null> {
  const link = await db.feedbackIssueLink.findFirst({
    where,
    select: {
      id: true,
      feedbackId: true,
      mirroredStatus: true,
      issueState: true,
      feedback: { select: { status: true } },
    },
  });
  if (!link) return null;

  return {
    tracker: "github",
    id: link.id,
    feedbackId: link.feedbackId,
    feedbackStatus: FeedbackStatusEnum.parse(link.feedback.status),
    mirroredStatus: parseMirroredStatus(link.mirroredStatus),
    issueState: {
      issueState: link.issueState === "closed" ? "closed" : "open",
    },
  };
}

async function findLinearIssueLink(
  db: typeof prisma,
  where: Prisma.FeedbackLinearIssueLinkWhereInput,
): Promise<MirroredIssueLink<"linear"> | null> {
  const link = await db.feedbackLinearIssueLink.findFirst({
    where,
    select: {
      id: true,
      feedbackId: true,
      mirroredStatus: true,
      issueStateId: true,
      issueStateType: true,
      feedback: { select: { status: true } },
    },
  });
  if (!link) return null;

  return {
    tracker: "linear",
    id: link.id,
    feedbackId: link.feedbackId,
    feedbackStatus: FeedbackStatusEnum.parse(link.feedback.status),
    mirroredStatus: parseMirroredStatus(link.mirroredStatus),
    issueState: {
      issueStateId: link.issueStateId,
      issueStateType: link.issueStateType,
    },
  };
}

async function findTrelloIssueLink(
  db: typeof prisma,
  where: Prisma.FeedbackTrelloIssueLinkWhereInput,
): Promise<MirroredIssueLink<"trello"> | null> {
  const link = await db.feedbackTrelloIssueLink.findFirst({
    where,
    select: {
      id: true,
      feedbackId: true,
      mirroredStatus: true,
      listId: true,
      archived: true,
      feedback: { select: { status: true } },
    },
  });
  if (!link) return null;

  return {
    tracker: "trello",
    id: link.id,
    feedbackId: link.feedbackId,
    feedbackStatus: FeedbackStatusEnum.parse(link.feedback.status),
    mirroredStatus: parseMirroredStatus(link.mirroredStatus),
    issueState: { listId: link.listId, archived: link.archived },
  };
}

function updateIssueLink(
  db: typeof prisma,
  { tracker, id, data }: IssueLinkUpdate,
) {
  switch (tracker) {
    case "github":
      return db.feedbackIssueLink.update({ where: { id }, data });
    case "linear":
      return db.feedbackLinearIssueLink.update({ where: { id }, data });
    case "jira":
      return db.feedbackJiraIssueLink.update({ where: { id }, data });
    case "trello":
      return db.feedbackTrelloIssueLink.update({ where: { id }, data });
  }
}
