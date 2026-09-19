import { rethrowDomainErrorsAsNonRetriable } from "@/server/errors/non-retriable";
import {
  listJiraTransitions,
  transitionJiraIssue,
} from "@/server/jira/jira-rest-client";
import {
  CATEGORY_DONE,
  resolveJiraTransition,
} from "@/server/jira/resolve-transition";
import { getValidJiraAccessToken } from "@/server/jira/token-access";
import type { FeedbackStatus } from "@/app/_domains/feedback/_types/feedback-status";
import { prisma } from "@workspace/db";
import { inngest } from "./index";

const SYNC_LOOP_WINDOW_MS = 30_000;

export const syncFeedbackStatusToJira = inngest.createFunction(
  {
    id: "sync-feedback-status-to-jira",
    retries: 3,
    concurrency: { key: "event.data.feedbackId", limit: 1 },
    triggers: [{ event: "feedback/status-changed" }],
  },
  async ({ event }) => {
    const { feedbackId, newStatus, origin } = event.data as {
      feedbackId: string;
      newStatus: string;
      origin?: "app" | "github" | "linear" | "jira";
    };

    // If this status change originated in Jira, don't echo back.
    if (origin === "jira") return { skipped: "origin_jira" };

    const issueLink = await prisma.feedbackJiraIssueLink.findUnique({
      where: { feedbackId },
      include: {
        projectJiraLink: { include: { jiraInstallation: true } },
      },
    });

    if (!issueLink) return { skipped: "no_jira_issue_link" };

    if (
      issueLink.lastSyncSource === "jira" &&
      issueLink.lastSyncAt &&
      Date.now() - issueLink.lastSyncAt.getTime() < SYNC_LOOP_WINDOW_MS
    ) {
      return { skipped: "sync_loop_prevention" };
    }

    const wantsDone = newStatus === "resolved" || newStatus === "closed";
    const isDone = issueLink.issueStatusCategory === CATEGORY_DONE;

    // Reopening only requires the issue to be out of Done — an issue already
    // sitting in To Do or In Progress is a faithful mirror of "not finished", so
    // shuffling it between those two categories would be pure churn in Jira.
    if (wantsDone === isDone) return { skipped: "status_category_unchanged" };

    const installation = issueLink.projectJiraLink.jiraInstallation;
    // A disconnected or refused Installation is a fact about the data, so the
    // next attempt reads the same row; an Atlassian outage still retries.
    const accessToken = await getValidJiraAccessToken(
      installation.organizationId,
    ).catch(rethrowDomainErrorsAsNonRetriable);

    const transitions = await listJiraTransitions(
      accessToken,
      installation.cloudId,
      issueLink.issueId,
    );

    const resolved = resolveJiraTransition({
      transitions,
      feedbackStatus: newStatus as FeedbackStatus,
    });

    if (!resolved) {
      // A workflow with no path to the target category is a customer choice, not
      // a broken link: log and move on rather than burning retries or flagging
      // the link unhealthy.
      console.warn(
        `[jira] no transition to ${wantsDone ? "done" : "open"} for issue ${issueLink.issueKey}`,
      );
      return { skipped: "no_transition_available" };
    }

    await transitionJiraIssue(
      accessToken,
      installation.cloudId,
      issueLink.issueId,
      {
        transitionId: resolved.transitionId,
        resolutionName: resolved.resolutionName,
      },
    );

    await prisma.feedbackJiraIssueLink.update({
      where: { id: issueLink.id },
      data: {
        issueStatusCategory: resolved.toStatusCategory,
        lastSyncSource: "app",
        lastSyncAt: new Date(),
      },
    });

    return {
      issueKey: issueLink.issueKey,
      newStatusCategory: resolved.toStatusCategory,
    };
  },
);
