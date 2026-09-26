import {
  formatIssueBody,
  formatIssueTitle,
} from "../../_helpers/github/format-issue-body";
import { getInstallationOctokit } from "./github-app";
import type { DiagnosticTrail } from "@fasterfixes/core";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { getAuthBaseUrl } from "@/utils/url/get-auth-base-url";
import { prisma } from "@workspace/db";
import { inngest } from "@/server/inngest";
import {
  feedbackCreatedEvent,
  feedbackIntegrationIssueRequestedEvent,
} from "@/server/inngest/events";

export const createGitHubIssue = inngest.createFunction(
  {
    id: "create-github-issue",
    retries: 3,
    concurrency: { key: "event.data.feedbackId", limit: 1 },
    triggers: [
      { event: feedbackCreatedEvent },
      {
        event: feedbackIntegrationIssueRequestedEvent,
        if: "event.data.target == 'github'",
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
            gitHubLink: {
              include: { gitHubInstallation: true },
            },
          },
        },
        reviewer: { select: { name: true } },
        screenshot: { select: { key: true, bucket: true } },
        issueLink: { select: { id: true } },
      },
    });

    if (!feedback) return { skipped: "feedback_not_found" };

    // Handler-level idempotency closes the duplicate-issue footgun: any future
    // emit of `feedback/created` (backfills, admin re-triggers) will short-circuit
    // here instead of creating a second GH issue.
    if (feedback.issueLink) {
      return { skipped: "github_issue_already_exists" };
    }

    const gitHubLink = feedback.project.gitHubLink;
    if (!gitHubLink) return { skipped: "no_github_link" };

    // Auto-create only on `feedback/created`. Manual trigger
    // (`feedback/integration-issue-requested`) bypasses the auto-create switch.
    const isManualTrigger =
      event.name === "feedback/integration-issue-requested";
    if (!isManualTrigger && !gitHubLink.autoCreateIssues) {
      return { skipped: "auto_create_disabled" };
    }

    const installation = gitHubLink.gitHubInstallation;
    const octokit = getInstallationOctokit(installation.installationId);

    let screenshotUrl: string | null = null;
    if (feedback.screenshot) {
      screenshotUrl = await getSignedAssetUrl(feedback.screenshot, 3600);
    }

    const baseUrl = getAuthBaseUrl();
    const dashboardUrl = `${baseUrl}/inbox?feedbackId=${feedback.id}`;

    const title = formatIssueTitle(feedback.comment);
    const body = formatIssueBody({
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
      projectId: feedback.projectId,
      dashboardUrl,
    });

    const response = await octokit.request(
      "POST /repos/{owner}/{repo}/issues",
      {
        owner: gitHubLink.repoOwner,
        repo: gitHubLink.repoName,
        title,
        body,
        labels: gitHubLink.defaultLabels,
      },
    );

    const issue = response.data as {
      number: number;
      html_url: string;
      node_id: string;
    };

    await prisma.feedbackIssueLink.create({
      data: {
        feedbackId: feedback.id,
        projectGitHubLinkId: gitHubLink.id,
        issueNumber: issue.number,
        issueUrl: issue.html_url,
        issueState: "open",
        issueNodeId: issue.node_id,
        lastSyncSource: "app",
        lastSyncAt: new Date(),
      },
    });

    return { issueNumber: issue.number, issueUrl: issue.html_url };
  },
);
