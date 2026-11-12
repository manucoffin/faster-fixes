import { rethrowDomainErrorsAsNonRetriable } from "@/server/errors/non-retriable";
import { JiraIssueConfigurationError } from "./jira-errors";
import {
  formatIssueAdf,
  formatJiraSummary,
} from "../../_helpers/jira/format-issue-adf";
import { createJiraIssue as createIssue } from "./jira-rest-client";
import { getValidJiraAccessToken } from "./token-access";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { buildFeedbackDashboardUrl } from "../../_helpers/build-feedback-dashboard-url";
import { findFeedbackWithAwaitedRecording } from "../find-feedback-with-awaited-recording";
import { refreshIssueRecording } from "../refresh-issue-recording";
import type { CustomMetadata, DiagnosticTrail } from "@fasterfixes/core";
import { prisma } from "@workspace/db";
import { inngest } from "@/server/inngest";
import {
  feedbackCreatedEvent,
  feedbackIntegrationIssueRequestedEvent,
} from "@/server/inngest/events";

export const createJiraIssue = inngest.createFunction(
  {
    id: "create-jira-issue",
    retries: 3,
    concurrency: { key: "event.data.feedbackId", limit: 1 },
    triggers: [
      { event: feedbackCreatedEvent },
      {
        event: feedbackIntegrationIssueRequestedEvent,
        if: "event.data.target == 'jira'",
      },
    ],
  },
  async ({ event, step }) => {
    const { feedbackId } = event.data;

    const found = await readFeedback(feedbackId);

    if (!found) return { skipped: "feedback_not_found" };

    // Handler-level idempotency: any re-emit of `feedback/created` (backfills,
    // admin re-triggers) short-circuits instead of creating a second issue.
    if (found.jiraIssueLink) {
      return { skipped: "jira_issue_already_exists" };
    }

    const link = found.project.jiraLink;
    if (!link) return { skipped: "no_jira_link" };

    // Auto-create only gates `feedback/created`. Manual export
    // (`feedback/integration-issue-requested`) bypasses the switch.
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
    if (feedback.jiraIssueLink) {
      return { skipped: "jira_issue_already_exists" };
    }

    const installation = link.jiraInstallation;
    // A disconnected or refused Installation is a fact about the data, so the
    // next attempt reads the same row; an Atlassian outage still retries.
    const accessToken = await getValidJiraAccessToken(
      installation.organizationId,
    ).catch(rethrowDomainErrorsAsNonRetriable);

    let screenshotUrl: string | null = null;
    if (feedback.screenshot) {
      screenshotUrl = await getSignedAssetUrl(feedback.screenshot, 3600);
    }

    const recording = await refreshIssueRecording(feedback);

    const description = formatIssueAdf({
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
      dashboardUrl: buildFeedbackDashboardUrl(feedback),
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

    let issue;
    try {
      issue = await createIssue(accessToken, installation.cloudId, {
        jiraProjectId: link.jiraProjectId,
        issueTypeId: link.issueTypeId,
        summary: formatJiraSummary(feedback.comment),
        description,
        labels: link.defaultLabels,
      });
    } catch (error) {
      // Configuration drift can't be retried away. Mark the link so the settings
      // UI can surface it rather than letting the failure die in the retry queue.
      if (error instanceof JiraIssueConfigurationError) {
        await prisma.projectJiraLink.update({
          where: { id: link.id },
          data: { linkHealthIssue: error.reason },
        });
        return { skipped: "jira_configuration_rejected", reason: error.reason };
      }
      throw error;
    }

    await prisma.feedbackJiraIssueLink.create({
      data: {
        feedbackId: feedback.id,
        projectJiraLinkId: link.id,
        issueId: issue.id,
        issueKey: issue.key,
        issueUrl: `${installation.siteUrl}/browse/${issue.key}`,
        issueStatusCategory: issue.statusCategory,
        lastSyncSource: "app",
        lastSyncAt: new Date(),
      },
    });

    return { issueId: issue.id, issueKey: issue.key };
  },
);

function readFeedback(feedbackId: string) {
  return prisma.feedback.findUnique({
    where: { id: feedbackId },
    include: {
      project: {
        include: {
          jiraLink: { include: { jiraInstallation: true } },
        },
      },
      reviewer: { select: { name: true } },
      video: { select: { title: true } },
      screenshot: { select: { key: true, bucket: true } },
      recording: { select: { key: true } },
      jiraIssueLink: { select: { id: true } },
    },
  });
}
