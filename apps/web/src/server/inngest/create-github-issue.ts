import {
  formatIssueBody,
  formatIssueTitle,
} from "@/server/github/format-issue-body";
import { getInstallationOctokit } from "@/server/github/github-app";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { prisma } from "@workspace/db";
import { inngest } from "./index";

export const createGitHubIssue = inngest.createFunction(
  {
    id: "create-github-issue",
    retries: 3,
    triggers: [{ event: "feedback/created" }],
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
      },
    });

    if (!feedback) return { skipped: "feedback_not_found" };

    const gitHubLink = feedback.project.gitHubLink;
    if (!gitHubLink || !gitHubLink.autoCreateIssues) {
      return { skipped: "no_github_link_or_auto_create_disabled" };
    }

    const installation = gitHubLink.gitHubInstallation;
    const octokit = getInstallationOctokit(installation.installationId);

    let screenshotUrl: string | null = null;
    if (feedback.screenshot) {
      screenshotUrl = await getSignedAssetUrl(feedback.screenshot, 3600);
    }

    const baseUrl = process.env.BETTER_AUTH_URL ?? process.env.BASE_URL!;
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
