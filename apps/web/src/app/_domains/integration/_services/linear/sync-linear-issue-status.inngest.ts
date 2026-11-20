import { feedbackStatusFromLinearStateType } from "../../_helpers/linear/state-mapping";
import type { LinearStateType } from "../../_helpers/linear/state-mapping";
import { prisma } from "@workspace/db";
import { inngest } from "@/server/inngest";
import { linearWebhookIssueEvent } from "@/server/inngest/events";
import { prismaStatusConvergence } from "../_prisma-status-convergence";
import { updateStatus } from "../update-status";

const SYNC_LOOP_WINDOW_MS = 60_000;

type IssueWebhookData = {
  id: string;
  state?: { id: string; type: string; name?: string };
  stateId?: string;
};

export const syncLinearIssueStatus = inngest.createFunction(
  {
    id: "sync-linear-issue-status",
    retries: 3,
    concurrency: { key: "event.data.issue.id", limit: 1 },
    triggers: [{ event: linearWebhookIssueEvent }],
  },
  async ({ event }) => {
    const issueData = event.data.issue as IssueWebhookData | undefined;
    if (!issueData?.id) return { skipped: "no_issue_data" };

    const issueLink = await prisma.feedbackLinearIssueLink.findFirst({
      where: { issueId: issueData.id },
    });

    if (!issueLink) return { skipped: "no_matching_issue_link" };

    // Loop prevention: if the app just pushed to Linear within the window, skip
    if (
      issueLink.lastSyncSource === "app" &&
      issueLink.lastSyncAt &&
      Date.now() - issueLink.lastSyncAt.getTime() < SYNC_LOOP_WINDOW_MS
    ) {
      return { skipped: "sync_loop_prevention" };
    }

    const stateType = issueData.state?.type as LinearStateType | undefined;
    const stateId = issueData.state?.id ?? issueData.stateId;
    if (!stateType || !stateId) {
      return { skipped: "no_state_in_payload" };
    }

    const newStatus = feedbackStatusFromLinearStateType(stateType);

    // Converges the other Trackers (e.g. GitHub) on the Feedback; the Linear
    // origin stops it echoing back to this issue.
    await updateStatus(
      {
        feedbackIds: [issueLink.feedbackId],
        status: newStatus,
        actor: "linear",
        issueLink: {
          tracker: "linear",
          id: issueLink.id,
          data: { issueStateId: stateId, issueStateType: stateType },
        },
      },
      prismaStatusConvergence(prisma, { awaitEvents: true }),
    );

    return { feedbackId: issueLink.feedbackId, newStatus };
  },
);
