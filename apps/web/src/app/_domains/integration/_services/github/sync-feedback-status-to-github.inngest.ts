import { getInstallationOctokit } from "./github-app";
import { prisma } from "@workspace/db";
import { inngest } from "@/server/inngest";
import { feedbackStatusChangedEvent } from "@/server/inngest/events";

const SYNC_LOOP_WINDOW_MS = 30_000;

export const syncFeedbackStatusToGitHub = inngest.createFunction(
  {
    id: "sync-feedback-status-to-github",
    retries: 3,
    concurrency: { key: "event.data.feedbackId", limit: 1 },
    triggers: [{ event: feedbackStatusChangedEvent }],
  },
  async ({ event }) => {
    const { feedbackId, newStatus, origin } = event.data;

    // If this status change originated on GitHub, don't echo back.
    if (origin === "github") return { skipped: "origin_github" };

    const issueLink = await prisma.feedbackIssueLink.findUnique({
      where: { feedbackId },
      include: {
        projectGitHubLink: {
          include: { gitHubInstallation: true },
        },
      },
    });

    if (!issueLink) return { skipped: "no_issue_link" };

    // Prevent sync loop: skip if GitHub triggered this change
    if (
      issueLink.lastSyncSource === "github" &&
      issueLink.lastSyncAt &&
      Date.now() - issueLink.lastSyncAt.getTime() < SYNC_LOOP_WINDOW_MS
    ) {
      return { skipped: "sync_loop_prevention" };
    }

    const installation = issueLink.projectGitHubLink.gitHubInstallation;
    const { repoOwner, repoName } = issueLink.projectGitHubLink;
    const octokit = getInstallationOctokit(installation.installationId);

    let newIssueState: "open" | "closed";
    let stateReason: "completed" | "not_planned" | undefined;

    if (newStatus === "resolved") {
      newIssueState = "closed";
      stateReason = "completed";
    } else if (newStatus === "closed") {
      newIssueState = "closed";
      stateReason = "not_planned";
    } else {
      // "new" or "in_progress" → reopen
      newIssueState = "open";
      stateReason = undefined;
    }

    // Only update if the state actually changed
    if (issueLink.issueState === newIssueState) {
      return { skipped: "state_unchanged" };
    }

    await octokit.request("PATCH /repos/{owner}/{repo}/issues/{issue_number}", {
      owner: repoOwner,
      repo: repoName,
      issue_number: issueLink.issueNumber,
      state: newIssueState,
      ...(stateReason && { state_reason: stateReason }),
    });

    await prisma.feedbackIssueLink.update({
      where: { id: issueLink.id },
      data: {
        issueState: newIssueState,
        lastSyncSource: "app",
        lastSyncAt: new Date(),
      },
    });

    return { issueNumber: issueLink.issueNumber, newIssueState };
  },
);
