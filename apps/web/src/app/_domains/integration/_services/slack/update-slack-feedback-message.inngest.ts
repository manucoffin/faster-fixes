import { buildFeedbackBlocks } from "../../_helpers/slack/build-feedback-blocks";
import { buildFeedbackDashboardUrl } from "../../_helpers/slack/build-feedback-dashboard-url";
import { decryptSlackToken } from "./token-crypto";
import { matchUnhealthySlackError } from "../../_helpers/slack/match-unhealthy-error";
import { getFreshScreenshotUrl } from "./get-fresh-screenshot-url";
import { updateMessage } from "./slack-client";
import { prisma } from "@workspace/db";
import { inngest } from "@/server/inngest";
import { feedbackStatusChangedEvent } from "@/server/inngest/events";

export const updateSlackFeedbackMessage = inngest.createFunction(
  {
    id: "update-slack-feedback-message",
    retries: 3,
    concurrency: { key: "event.data.feedbackId", limit: 1 },
    triggers: [{ event: feedbackStatusChangedEvent }],
  },
  async ({ event }) => {
    const { feedbackId, newStatus, actor } = event.data;

    const message = await prisma.feedbackSlackMessage.findUnique({
      where: { feedbackId },
    });

    // No-op when the feedback was never posted to Slack.
    if (!message) return { skipped: "no_slack_message" };

    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        reviewer: { select: { name: true } },
        screenshot: { select: { key: true, bucket: true, provider: true } },
        project: {
          include: {
            slackLink: { include: { installation: true } },
          },
        },
      },
    });

    if (!feedback) return { skipped: "feedback_not_found" };

    const link = feedback.project.slackLink;
    if (!link) return { skipped: "no_slack_link" };
    if (!link.enabled) return { skipped: "slack_link_disabled" };
    if (!link.linkHealthy) return { skipped: "slack_link_unhealthy" };

    const botToken = decryptSlackToken(link.installation.botToken);
    const screenshotUrl = await getFreshScreenshotUrl(feedback);

    const { blocks, text } = buildFeedbackBlocks({
      feedback: {
        reviewerName: feedback.reviewer.name,
        comment: feedback.comment,
        pageUrl: feedback.pageUrl,
        browserName: feedback.browserName,
        os: feedback.os,
      },
      status: newStatus,
      // The badge only distinguishes automated resolutions from human ones;
      // "user" and "tracker" both map to a human-driven change.
      actor: actor === "agent" ? "agent" : "human",
      dashboardUrl: buildFeedbackDashboardUrl(feedback.id),
      screenshotUrl,
    });

    try {
      await updateMessage({
        botToken,
        channel: message.channelId,
        ts: message.messageTs,
        blocks,
        text,
      });
    } catch (error) {
      const healthIssue = matchUnhealthySlackError(error);
      if (!healthIssue) throw error; // transient: let Inngest retry

      await prisma.projectSlackLink.update({
        where: { id: link.id },
        data: { linkHealthy: false, healthIssue },
      });
      return { skipped: "slack_link_marked_unhealthy" };
    }

    await prisma.feedbackSlackMessage.update({
      where: { id: message.id },
      data: { lastSyncAt: new Date() },
    });

    return { updated: true };
  },
);
