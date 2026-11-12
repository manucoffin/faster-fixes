import {
  formatIssueBody,
  formatIssueTitle,
} from "../../_helpers/github/format-issue-body";
import type { CustomMetadata, DiagnosticTrail } from "@fasterfixes/core";
import { decryptToken } from "./token-crypto";
import { getLinearClient } from "./linear-client";
import { getFeedbackStateId } from "./get-feedback-state-id";
import { getValidLabelIds } from "./get-valid-label-ids";
import { LinearRequestError } from "./linear-request-error";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { buildFeedbackDashboardUrl } from "../../_helpers/build-feedback-dashboard-url";
import { findFeedbackWithAwaitedRecording } from "../find-feedback-with-awaited-recording";
import { refreshIssueRecording } from "../refresh-issue-recording";
import type { FeedbackStatus } from "@/app/_domains/feedback";
import { prisma } from "@workspace/db";
import { inngest } from "@/server/inngest";
import {
  feedbackCreatedEvent,
  feedbackIntegrationIssueRequestedEvent,
} from "@/server/inngest/events";

export const createLinearIssue = inngest.createFunction(
  {
    id: "create-linear-issue",
    retries: 3,
    concurrency: { key: "event.data.feedbackId", limit: 1 },
    triggers: [
      { event: feedbackCreatedEvent },
      {
        event: feedbackIntegrationIssueRequestedEvent,
        if: "event.data.target == 'linear'",
      },
    ],
  },
  async ({ event, step }) => {
    const { feedbackId } = event.data;

    const found = await readFeedback(feedbackId);

    if (!found) return { skipped: "feedback_not_found" };
    if (found.linearIssueLink) {
      return { skipped: "linear_issue_already_exists" };
    }

    const link = found.project.linearLink;
    if (!link) return { skipped: "no_linear_link" };

    // Auto-create only fires on `feedback/created`. Manual trigger
    // (`feedback/integration-issue-requested`) bypasses the auto-create switch.
    const isManualTrigger =
      event.name === "feedback/integration-issue-requested";
    if (!isManualTrigger && !link.autoCreateIssues) {
      return { skipped: "auto_create_disabled" };
    }

    const feedback = await findFeedbackWithAwaitedRecording({
      event,
      step,
      feedback: found,
      readFeedback: () => readFeedback(feedbackId),
    });
    if (!feedback) return { skipped: "feedback_not_found" };
    // An Issue created by hand during the wait wins.
    if (feedback.linearIssueLink) {
      return { skipped: "linear_issue_already_exists" };
    }

    const accessToken = decryptToken(link.linearInstallation.accessToken);
    const client = getLinearClient(accessToken);

    const resolved = await getFeedbackStateId({
      client,
      link,
      feedbackStatus: feedback.status as FeedbackStatus,
    });

    if (!resolved) {
      return { skipped: "no_team_states_available" };
    }

    const { valid: validLabels, droppedCount } = await getValidLabelIds(
      client,
      link.teamId,
      link.defaultLabelIds,
    );

    let screenshotUrl: string | null = null;
    if (feedback.screenshot) {
      screenshotUrl = await getSignedAssetUrl(feedback.screenshot, 3600);
    }

    const dashboardUrl = buildFeedbackDashboardUrl(feedback);
    const recording = await refreshIssueRecording(feedback);

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
      diagnosticTrail: feedback.diagnosticTrail as DiagnosticTrail | null,
      customMetadata: feedback.customMetadata as CustomMetadata | null,
      projectId: feedback.projectId,
      dashboardUrl,
      videoId: feedback.videoId,
      videoTitle: feedback.video?.title,
      startMs: feedback.startMs,
      endMs: feedback.endMs,
      frameX: feedback.frameX,
      frameY: feedback.frameY,
      frameWidth: feedback.frameWidth,
      frameHeight: feedback.frameHeight,
      recording,
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
      throw new LinearRequestError(
        "Linear createIssue did not return an issue.",
      );
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

function readFeedback(feedbackId: string) {
  return prisma.feedback.findUnique({
    where: { id: feedbackId },
    include: {
      project: {
        include: {
          linearLink: { include: { linearInstallation: true } },
        },
      },
      reviewer: { select: { name: true } },
      video: { select: { title: true } },
      screenshot: { select: { key: true, bucket: true } },
      recording: { select: { key: true } },
      linearIssueLink: { select: { id: true } },
    },
  });
}
