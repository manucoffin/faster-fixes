import type { FeedbackStatus } from "@/app/_domains/feedback";
import { prisma } from "@workspace/db";
import { inngest } from "@/server/inngest";
import { githubWebhookIssuesEvent } from "@/server/inngest/events";
import { prismaStatusConvergence } from "../_prisma-status-convergence";
import { updateStatus } from "../update-status";

const SYNC_LOOP_WINDOW_MS = 30_000;

export const syncGitHubIssueStatus = inngest.createFunction(
  {
    id: "sync-github-issue-status",
    retries: 3,
    concurrency: {
      key: "event.data.repoFullName + ':' + event.data.issueNumber",
      limit: 1,
    },
    triggers: [{ event: githubWebhookIssuesEvent }],
  },
  async ({ event }) => {
    const { action, issueNumber, repoFullName } = event.data;

    const issueLink = await prisma.feedbackIssueLink.findFirst({
      where: {
        issueNumber,
        projectGitHubLink: { repoFullName },
      },
    });

    if (!issueLink) return { skipped: "no_matching_issue_link" };

    // Prevent sync loop: skip if we triggered this change from the app
    if (
      issueLink.lastSyncSource === "app" &&
      issueLink.lastSyncAt &&
      Date.now() - issueLink.lastSyncAt.getTime() < SYNC_LOOP_WINDOW_MS
    ) {
      return { skipped: "sync_loop_prevention" };
    }

    let newStatus: FeedbackStatus;
    if (action === "closed") {
      newStatus = "resolved";
    } else if (action === "reopened") {
      newStatus = "in_progress";
    } else {
      return { skipped: "unhandled_action" };
    }

    // Converges the other Trackers (e.g. Linear) on the Feedback; the GitHub
    // origin stops it echoing back to this Issue.
    await updateStatus(
      {
        feedbackIds: [issueLink.feedbackId],
        status: newStatus,
        actor: "github",
        issueLink: {
          tracker: "github",
          id: issueLink.id,
          data: { issueState: action === "closed" ? "closed" : "open" },
        },
      },
      prismaStatusConvergence(prisma, { awaitEvents: true }),
    );

    return { feedbackId: issueLink.feedbackId, newStatus };
  },
);
