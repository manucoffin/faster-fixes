import { feedbackStatusFromLinearStateType } from "@/app/_domains/integration/_helpers/linear/state-mapping";
import type { LinearStateType } from "@/app/_domains/integration/_helpers/linear/state-mapping";
import { prisma } from "@workspace/db";
import { inngest } from "./index";

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
    triggers: [{ event: "linear/webhook.issue" }],
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

    await prisma.$transaction([
      prisma.feedback.update({
        where: { id: issueLink.feedbackId },
        data: { status: newStatus },
      }),
      prisma.feedbackLinearIssueLink.update({
        where: { id: issueLink.id },
        data: {
          issueStateId: stateId,
          issueStateType: stateType,
          lastSyncSource: "linear",
          lastSyncAt: new Date(),
        },
      }),
    ]);

    // Propagate to other trackers (e.g. GitHub) so the feedback stays canonical.
    await inngest.send({
      name: "feedback/status-changed",
      data: {
        feedbackId: issueLink.feedbackId,
        newStatus,
        origin: "linear",
        // Change originated from the Linear issue webhook syncing back.
        actor: "tracker",
      },
    });

    return { feedbackId: issueLink.feedbackId, newStatus };
  },
);
