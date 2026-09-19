import { rethrowDomainErrorsAsNonRetriable } from "@/server/errors/non-retriable";
import { fetchJiraIssueStatus } from "@/app/_domains/integration/_services/jira/jira-rest-client";
import { feedbackStatusFromJiraStatusCategory } from "@/app/_domains/integration/_helpers/jira/transition-mapping";
import { getValidJiraAccessToken } from "@/app/_domains/integration/_services/jira/token-access";
import { prisma } from "@workspace/db";
import { inngest } from "./index";

const SYNC_LOOP_WINDOW_MS = 30_000;

/**
 * Moving an issue between Jira projects reissues its key (PAY-123 -> ENG-45),
 * which also invalidates the stored browse URL. The id we sync on never changes,
 * so this is a display-only repair of the denormalized columns.
 */
function renamedIssueFields(
  storedKey: string,
  fetchedKey: string,
  installation: { siteUrl: string },
) {
  if (storedKey === fetchedKey) return {};

  return {
    issueKey: fetchedKey,
    issueUrl: `${installation.siteUrl}/browse/${fetchedKey}`,
  };
}

export const syncJiraIssueStatus = inngest.createFunction(
  {
    id: "sync-jira-issue-status",
    retries: 3,
    concurrency: { key: "event.data.issueId", limit: 1 },
    triggers: [{ event: "jira/webhook.issue" }],
  },
  async ({ event }) => {
    const { installationId, issueId, webhookEvent } = event.data as {
      installationId: string;
      issueId: string;
      webhookEvent: string;
    };

    // Scoped to the installation the delivery token identified, so a payload
    // naming an issue id belonging to another tenant finds no link.
    const issueLink = await prisma.feedbackJiraIssueLink.findFirst({
      where: {
        issueId,
        projectJiraLink: { jiraInstallationId: installationId },
      },
      include: {
        projectJiraLink: { include: { jiraInstallation: true } },
      },
    });

    if (!issueLink) return { skipped: "no_matching_issue_link" };

    const installation = issueLink.projectJiraLink.jiraInstallation;
    // A disconnected or refused Installation is a fact about the data, so the
    // next attempt reads the same row; an Atlassian outage still retries.
    const accessToken = await getValidJiraAccessToken(
      installation.organizationId,
    ).catch(rethrowDomainErrorsAsNonRetriable);

    // Re-fetch before apply: the payload said something changed, Jira says what.
    const issue = await fetchJiraIssueStatus(
      accessToken,
      installation.cloudId,
      issueId,
    );

    // Confirmed gone. Detaching rather than cascading to the Feedback keeps the
    // inbox intact and lets the Feedback be exported to Jira again.
    if (!issue) {
      await prisma.feedbackJiraIssueLink.delete({
        where: { id: issueLink.id },
      });
      return { feedbackId: issueLink.feedbackId, detached: true };
    }

    // Jira still has the issue, so a delete event here was stale or forged.
    if (webhookEvent === "jira:issue_deleted") {
      return { skipped: "deletion_not_confirmed" };
    }

    if (
      issueLink.lastSyncSource === "app" &&
      issueLink.lastSyncAt &&
      Date.now() - issueLink.lastSyncAt.getTime() < SYNC_LOOP_WINDOW_MS
    ) {
      return { skipped: "sync_loop_prevention" };
    }

    const newStatus = feedbackStatusFromJiraStatusCategory(
      issue.statusCategory,
    );

    const feedback = await prisma.feedback.findUnique({
      where: { id: issueLink.feedbackId },
      select: { status: true },
    });

    if (!feedback) return { skipped: "feedback_not_found" };

    // Jira fires issue_updated for edits that have nothing to do with status
    // (comments, assignee, fields), so most deliveries land here. Record what the
    // issue's category actually is — outbound sync reads it to decide whether a
    // transition is needed — but leave the Feedback and the event bus alone.
    if (feedback.status === newStatus) {
      if (
        issueLink.issueStatusCategory !== issue.statusCategory ||
        issueLink.issueKey !== issue.key
      ) {
        await prisma.feedbackJiraIssueLink.update({
          where: { id: issueLink.id },
          data: {
            issueStatusCategory: issue.statusCategory,
            ...renamedIssueFields(issueLink.issueKey, issue.key, installation),
          },
        });
      }
      return { skipped: "status_unchanged" };
    }

    await prisma.$transaction([
      prisma.feedback.update({
        where: { id: issueLink.feedbackId },
        data: { status: newStatus },
      }),
      prisma.feedbackJiraIssueLink.update({
        where: { id: issueLink.id },
        data: {
          issueStatusCategory: issue.statusCategory,
          lastSyncSource: "jira",
          lastSyncAt: new Date(),
          ...renamedIssueFields(issueLink.issueKey, issue.key, installation),
        },
      }),
    ]);

    // Converge the other Trackers on the Feedback. `origin: "jira"` stops this
    // from echoing straight back to the issue it came from.
    await inngest.send({
      name: "feedback/status-changed",
      data: {
        feedbackId: issueLink.feedbackId,
        newStatus,
        origin: "jira",
        actor: "tracker",
      },
    });

    return { feedbackId: issueLink.feedbackId, newStatus };
  },
);
