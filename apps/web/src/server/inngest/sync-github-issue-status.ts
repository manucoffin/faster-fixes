import { prisma } from "@workspace/db";
import { inngest } from "./index";

const SYNC_LOOP_WINDOW_MS = 30_000;

export const syncGitHubIssueStatus = inngest.createFunction(
  {
    id: "sync-github-issue-status",
    retries: 3,
    triggers: [{ event: "github/webhook.issues" }],
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

    let newStatus: string;
    if (action === "closed") {
      newStatus = "resolved";
    } else if (action === "reopened") {
      newStatus = "in_progress";
    } else {
      return { skipped: "unhandled_action" };
    }

    await prisma.$transaction([
      prisma.feedback.update({
        where: { id: issueLink.feedbackId },
        data: { status: newStatus },
      }),
      prisma.feedbackIssueLink.update({
        where: { id: issueLink.id },
        data: {
          issueState: action === "closed" ? "closed" : "open",
          lastSyncSource: "github",
          lastSyncAt: new Date(),
        },
      }),
    ]);

    return { feedbackId: issueLink.feedbackId, newStatus };
  },
);
