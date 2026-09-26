import { buildFeedbackBlocks } from "../../_helpers/slack/build-feedback-blocks";
import { buildFeedbackDashboardUrl } from "../../_helpers/slack/build-feedback-dashboard-url";
import { decryptSlackToken } from "./token-crypto";
import { matchUnhealthySlackError } from "../../_helpers/slack/match-unhealthy-error";
import { getFreshScreenshotUrl } from "./get-fresh-screenshot-url";
import { postMessage } from "./slack-client";
import { prisma } from "@workspace/db";
import { inngest } from "@/server/inngest";
import { feedbackCreatedEvent } from "@/server/inngest/events";

export const notifySlackFeedbackCreated = inngest.createFunction(
  {
    id: "notify-slack-feedback-created",
    retries: 3,
    concurrency: { key: "event.data.feedbackId", limit: 1 },
    triggers: [{ event: feedbackCreatedEvent }],
  },
  async ({ event }) => {
    const { feedbackId } = event.data;

    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        reviewer: { select: { name: true } },
        screenshot: { select: { key: true, bucket: true, provider: true } },
        slackMessage: { select: { id: true } },
        project: {
          include: {
            slackLink: { include: { installation: true } },
          },
        },
      },
    });

    if (!feedback) return { skipped: "feedback_not_found" };

    // Idempotency: never post twice for the same feedback.
    if (feedback.slackMessage) {
      return { skipped: "slack_message_already_exists" };
    }

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
      status: "new",
      // A freshly submitted feedback has no automated action yet.
      actor: "human",
      dashboardUrl: buildFeedbackDashboardUrl(feedback.id),
      screenshotUrl,
    });

    let result: { ts: string; channel: string };
    try {
      result = await postMessage({
        botToken,
        channel: link.channelId,
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

    await prisma.feedbackSlackMessage.create({
      data: {
        feedbackId: feedback.id,
        projectSlackLinkId: link.id,
        channelId: result.channel,
        messageTs: result.ts,
      },
    });

    return { posted: true, messageTs: result.ts };
  },
);
