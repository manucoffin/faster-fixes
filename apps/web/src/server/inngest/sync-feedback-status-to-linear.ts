import { decryptToken } from "@/server/linear/crypto";
import { getLinearClient } from "@/server/linear/linear-client";
import { resolveStateIdForFeedback } from "@/server/linear/resolve-team-state";
import type { FeedbackStatus } from "@/types/feedback-status";
import { prisma } from "@workspace/db";
import { inngest } from "./index";

const SYNC_LOOP_WINDOW_MS = 60_000;

export const syncFeedbackStatusToLinear = inngest.createFunction(
  {
    id: "sync-feedback-status-to-linear",
    retries: 3,
    concurrency: { key: "event.data.feedbackId", limit: 1 },
    triggers: [{ event: "feedback/status-changed" }],
  },
  async ({ event }) => {
    const { feedbackId, newStatus, origin } = event.data as {
      feedbackId: string;
      newStatus: string;
      origin?: "app" | "github" | "linear";
    };

    // If this status change originated on Linear, don't echo back.
    if (origin === "linear") return { skipped: "origin_linear" };

    const issueLink = await prisma.feedbackLinearIssueLink.findUnique({
      where: { feedbackId },
      include: {
        projectLinearLink: { include: { linearInstallation: true } },
      },
    });

    if (!issueLink) return { skipped: "no_linear_issue_link" };

    if (
      issueLink.lastSyncSource === "linear" &&
      issueLink.lastSyncAt &&
      Date.now() - issueLink.lastSyncAt.getTime() < SYNC_LOOP_WINDOW_MS
    ) {
      return { skipped: "sync_loop_prevention" };
    }

    const accessToken = decryptToken(
      issueLink.projectLinearLink.linearInstallation.accessToken,
    );
    const client = getLinearClient(accessToken);

    const resolved = await resolveStateIdForFeedback({
      client,
      link: issueLink.projectLinearLink,
      feedbackStatus: newStatus as FeedbackStatus,
    });

    if (!resolved) return { skipped: "no_team_states_available" };
    if (resolved.stateId === issueLink.issueStateId) {
      return { skipped: "state_unchanged" };
    }

    await client.updateIssue(issueLink.issueId, { stateId: resolved.stateId });

    const updates: Array<Promise<unknown>> = [
      prisma.feedbackLinearIssueLink.update({
        where: { id: issueLink.id },
        data: {
          issueStateId: resolved.stateId,
          lastSyncSource: "app",
          lastSyncAt: new Date(),
        },
      }),
    ];
    if (resolved.fellBack) {
      updates.push(
        prisma.projectLinearLink.update({
          where: { id: issueLink.projectLinearLinkId },
          data: { linkHealthIssue: "stale_default_state" },
        }),
      );
    }
    await Promise.all(updates);

    return { issueId: issueLink.issueId, newStateId: resolved.stateId };
  },
);
