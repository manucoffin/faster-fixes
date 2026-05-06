import {
  formatIssueBody,
  formatIssueTitle,
} from "@/server/github/format-issue-body";
import { decryptToken } from "@/server/linear/crypto";
import { getLinearClient } from "@/server/linear/linear-client";
import {
  filterValidLabelIds,
  resolveStateIdForFeedback,
} from "@/server/linear/resolve-team-state";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import type { FeedbackStatus } from "@/types/feedback-status";
import { prisma } from "@workspace/db";
import { inngest } from "./index";

export const createLinearIssue = inngest.createFunction(
  {
    id: "create-linear-issue",
    retries: 3,
    concurrency: { key: "event.data.feedbackId", limit: 1 },
    triggers: [
      { event: "feedback/created" },
      {
        event: "feedback/integration-issue-requested",
        if: "event.data.target == 'linear'",
      },
    ],
  },
  async ({ event }) => {
    const { feedbackId } = event.data;

    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        project: {
          include: {
            linearLink: { include: { linearInstallation: true } },
          },
        },
        reviewer: { select: { name: true } },
        screenshot: { select: { key: true, bucket: true } },
        linearIssueLink: { select: { id: true } },
      },
    });

    if (!feedback) return { skipped: "feedback_not_found" };
    if (feedback.linearIssueLink) {
      return { skipped: "linear_issue_already_exists" };
    }

    const link = feedback.project.linearLink;
    if (!link) return { skipped: "no_linear_link" };

    // Auto-create only fires on `feedback/created`. Manual trigger
    // (`feedback/integration-issue-requested`) bypasses the auto-create switch.
    const isManualTrigger =
      event.name === "feedback/integration-issue-requested";
    if (!isManualTrigger && !link.autoCreateIssues) {
      return { skipped: "auto_create_disabled" };
    }

    const accessToken = decryptToken(link.linearInstallation.accessToken);
    const client = getLinearClient(accessToken);

    const resolved = await resolveStateIdForFeedback({
      client,
      link,
      feedbackStatus: feedback.status as FeedbackStatus,
    });

    if (!resolved) {
      return { skipped: "no_team_states_available" };
    }

    const { valid: validLabels, droppedCount } = await filterValidLabelIds(
      client,
      link.teamId,
      link.defaultLabelIds,
    );

    let screenshotUrl: string | null = null;
    if (feedback.screenshot) {
      screenshotUrl = await getSignedAssetUrl(feedback.screenshot, 3600);
    }

    const baseUrl = process.env.BETTER_AUTH_URL ?? process.env.BASE_URL!;
    const dashboardUrl = `${baseUrl}/inbox?feedbackId=${feedback.id}`;

    const title = formatIssueTitle(feedback.comment);
    const description = formatIssueBody({
      id: feedback.id,
      comment: feedback.comment,
      pageUrl: feedback.pageUrl,
      selector: feedback.selector,
      clickX: feedback.clickX,
      clickY: feedback.clickY,
      browserName: feedback.browserName,
      browserVersion: feedback.browserVersion,
      os: feedback.os,
      viewportWidth: feedback.viewportWidth,
      viewportHeight: feedback.viewportHeight,
      screenshotUrl,
      reviewerName: feedback.reviewer.name,
      metadata: feedback.metadata as Record<string, unknown> | null,
      projectId: feedback.projectId,
      dashboardUrl,
    });

    const created = await client.createIssue({
      teamId: link.teamId,
      title,
      description,
      labelIds: validLabels.length > 0 ? validLabels : undefined,
      priority: link.defaultPriority,
      stateId: resolved.stateId,
    });

    const issue = await created.issue;
    if (!issue) {
      throw new Error("Linear createIssue did not return an issue.");
    }

    const stateRef = await issue.state;
    const stateType = stateRef?.type ?? "unstarted";

    const healthUpdate: { linkHealthIssue?: string } = {};
    if (resolved.fellBack) healthUpdate.linkHealthIssue = "stale_default_state";
    else if (droppedCount > 0) healthUpdate.linkHealthIssue = "stale_label";

    await prisma.$transaction([
      prisma.feedbackLinearIssueLink.create({
        data: {
          feedbackId: feedback.id,
          projectLinearLinkId: link.id,
          issueId: issue.id,
          issueIdentifier: issue.identifier,
          issueUrl: issue.url,
          issueStateId: resolved.stateId,
          issueStateType: stateType,
          lastSyncSource: "app",
          lastSyncAt: new Date(),
        },
      }),
      ...(healthUpdate.linkHealthIssue
        ? [
            prisma.projectLinearLink.update({
              where: { id: link.id },
              data: healthUpdate,
            }),
          ]
        : []),
    ]);

    return { issueId: issue.id, issueIdentifier: issue.identifier };
  },
);
