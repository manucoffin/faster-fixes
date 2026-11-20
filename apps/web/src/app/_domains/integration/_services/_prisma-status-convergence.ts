import { inngest } from "@/server/inngest";
import {
  buildEvent,
  feedbackStatusChangedEvent,
} from "@/server/inngest/events";
import { prisma } from "@workspace/db";
import { FeedbackStatusEnum } from "@/app/_domains/feedback";
import type {
  IssueLinkUpdate,
  IssueReference,
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
            return findJiraIssueLink(db, reference);
          case "github":
            return findGitHubIssueLink(db, reference);
          case "linear":
            return findLinearIssueLink(db, reference);
        }
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
  { issueId, installationId }: IssueReference<"jira">,
): Promise<MirroredIssueLink<"jira"> | null> {
  // Scoped to the Installation the delivery token identified, so a payload
  // naming an issue id of another tenant finds no link.
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
    mirroredStatus: parseMirroredStatus(link.mirroredStatus),
    issueState: { issueStatusCategory: link.issueStatusCategory },
  };
}

async function findGitHubIssueLink(
  db: typeof prisma,
  { repoFullName, issueNumber }: IssueReference<"github">,
): Promise<MirroredIssueLink<"github"> | null> {
  const link = await db.feedbackIssueLink.findFirst({
    where: { issueNumber, projectGitHubLink: { repoFullName } },
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
  { issueId, installationId }: IssueReference<"linear">,
): Promise<MirroredIssueLink<"linear"> | null> {
  // Scoped to the Installation the signed delivery named, as Jira's is.
  const link = await db.feedbackLinearIssueLink.findFirst({
    where: {
      issueId,
      projectLinearLink: { linearInstallationId: installationId },
    },
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
