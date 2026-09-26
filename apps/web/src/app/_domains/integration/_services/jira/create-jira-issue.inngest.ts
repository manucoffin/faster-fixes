import { rethrowDomainErrorsAsNonRetriable } from "@/server/errors/non-retriable";
import { JiraIssueConfigurationError } from "./jira-errors";
import {
  formatIssueAdf,
  formatJiraSummary,
} from "../../_helpers/jira/format-issue-adf";
import { createJiraIssue as createIssue } from "./jira-rest-client";
import { getValidJiraAccessToken } from "./token-access";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { getAuthBaseUrl } from "@/utils/url/get-auth-base-url";
import type { DiagnosticTrail } from "@fasterfixes/core";
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
  async ({ event }) => {
    const { feedbackId } = event.data;

    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        project: {
          include: {
            jiraLink: { include: { jiraInstallation: true } },
          },
        },
        reviewer: { select: { name: true } },
        screenshot: { select: { key: true, bucket: true } },
        jiraIssueLink: { select: { id: true } },
      },
    });

    if (!feedback) return { skipped: "feedback_not_found" };

    // Handler-level idempotency: any re-emit of `feedback/created` (backfills,
    // admin re-triggers) short-circuits instead of creating a second issue.
    if (feedback.jiraIssueLink) {
      return { skipped: "jira_issue_already_exists" };
    }

    const link = feedback.project.jiraLink;
    if (!link) return { skipped: "no_jira_link" };

    // Auto-create only gates `feedback/created`. Manual export
    // (`feedback/integration-issue-requested`) bypasses the switch.
    const isManualTrigger =
      event.name === "feedback/integration-issue-requested";
    if (!isManualTrigger && !link.autoCreateIssues) {
      return { skipped: "auto_create_disabled" };
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

    const baseUrl = getAuthBaseUrl();

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
      dashboardUrl: `${baseUrl}/inbox?feedbackId=${feedback.id}`,
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
