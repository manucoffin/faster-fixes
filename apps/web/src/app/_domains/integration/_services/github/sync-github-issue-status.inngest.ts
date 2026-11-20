import { prisma } from "@workspace/db";
import { inngest } from "@/server/inngest";
import { githubWebhookIssuesEvent } from "@/server/inngest/events";
import { prismaStatusConvergence } from "../_prisma-status-convergence";
import { applyObservedIssueState } from "../apply-observed-issue-state";
import { gitHubTrackerAdapter } from "./_github-tracker-adapter";

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

    return applyObservedIssueState(
      {
        reference: { tracker: "github", repoFullName, issueNumber },
        deleted: action === "deleted",
      },
      gitHubTrackerAdapter(prisma),
      prismaStatusConvergence(prisma, { awaitEvents: true }),
    );
  },
);
