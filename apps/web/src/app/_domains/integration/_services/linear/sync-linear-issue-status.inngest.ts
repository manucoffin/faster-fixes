import { prisma } from "@workspace/db";
import { inngest } from "@/server/inngest";
import { linearWebhookIssueEvent } from "@/server/inngest/events";
import { prismaStatusConvergence } from "../_prisma-status-convergence";
import { applyObservedIssueState } from "../apply-observed-issue-state";
import { linearTrackerAdapter } from "./_linear-tracker-adapter";

export const syncLinearIssueStatus = inngest.createFunction(
  {
    id: "sync-linear-issue-status",
    retries: 3,
    concurrency: { key: "event.data.issue.id", limit: 1 },
    triggers: [{ event: linearWebhookIssueEvent }],
  },
  async ({ event }) => {
    const { action, installationId, issue } = event.data;
    const issueId = issue?.id;
    if (typeof issueId !== "string") return { skipped: "no_issue_data" };

    return applyObservedIssueState(
      {
        reference: { tracker: "linear", issueId, installationId },
        deleted: action === "remove",
      },
      linearTrackerAdapter(prisma),
      prismaStatusConvergence(prisma, { awaitEvents: true }),
    );
  },
);
