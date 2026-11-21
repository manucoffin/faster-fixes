import { prisma } from "@workspace/db";
import { inngest } from "@/server/inngest";
import { jiraWebhookIssueEvent } from "@/server/inngest/events";
import { prismaStatusConvergence } from "../_prisma-status-convergence";
import { applyObservedIssueState } from "../apply-observed-issue-state";
import { jiraTrackerAdapter } from "./_jira-tracker-adapter";

export const syncJiraIssueStatus = inngest.createFunction(
  {
    id: "sync-jira-issue-status",
    retries: 3,
    concurrency: { key: "event.data.issueId", limit: 1 },
    triggers: [{ event: jiraWebhookIssueEvent }],
  },
  async ({ event }) => {
    const { installationId, issueId, webhookEvent } = event.data;

    return applyObservedIssueState(
      {
        reference: { tracker: "jira", issueId, installationId },
        deleted: webhookEvent === "jira:issue_deleted",
      },
      jiraTrackerAdapter(prisma),
      prismaStatusConvergence(prisma, { awaitEvents: true }),
    );
  },
);
