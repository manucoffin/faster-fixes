import { inngest } from "@/server/inngest";
import { addContactToSegment } from "@/app/_domains/user/_services/add-contact-to-segment.inngest";
import { createGitHubIssue } from "@/app/_domains/integration/_services/github/create-github-issue.inngest";
import { createJiraIssue } from "@/app/_domains/integration/_services/jira/create-jira-issue.inngest";
import { createLinearIssue } from "@/app/_domains/integration/_services/linear/create-linear-issue.inngest";
import { handleJiraOAuthRevoked } from "@/app/_domains/integration/_services/jira/handle-jira-oauth-revoked.inngest";
import { handleLinearOAuthRevoked } from "@/app/_domains/integration/_services/linear/handle-linear-oauth-revoked.inngest";
import { notifySlackFeedbackCreated } from "@/app/_domains/integration/_services/slack/notify-slack-feedback-created.inngest";
import { refreshJiraInstallationWebhooks } from "@/app/_domains/integration/_services/jira/refresh-jira-installation-webhooks.inngest";
import { refreshJiraWebhooks } from "@/app/_domains/integration/_services/jira/refresh-jira-webhooks.inngest";
import { sendWelcomeEmail } from "@/app/_domains/user/_services/send-welcome-email.inngest";
import { syncFeedbackStatusToGitHub } from "@/app/_domains/integration/_services/github/sync-feedback-status-to-github.inngest";
import { syncFeedbackStatusToJira } from "@/app/_domains/integration/_services/jira/sync-feedback-status-to-jira.inngest";
import { syncFeedbackStatusToLinear } from "@/app/_domains/integration/_services/linear/sync-feedback-status-to-linear.inngest";
import { syncGitHubIssueStatus } from "@/app/_domains/integration/_services/github/sync-github-issue-status.inngest";
import { syncJiraIssueStatus } from "@/app/_domains/integration/_services/jira/sync-jira-issue-status.inngest";
import { syncLinearIssueStatus } from "@/app/_domains/integration/_services/linear/sync-linear-issue-status.inngest";
import { updateSlackFeedbackMessage } from "@/app/_domains/integration/_services/slack/update-slack-feedback-message.inngest";
import { serve } from "inngest/next";

// Required by v4 checkpointing: client maxRuntime ("50s") must sit below this.
export const maxDuration = 60;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    createGitHubIssue,
    syncGitHubIssueStatus,
    syncFeedbackStatusToGitHub,
    createLinearIssue,
    syncLinearIssueStatus,
    syncFeedbackStatusToLinear,
    handleLinearOAuthRevoked,
    createJiraIssue,
    syncJiraIssueStatus,
    syncFeedbackStatusToJira,
    handleJiraOAuthRevoked,
    refreshJiraWebhooks,
    refreshJiraInstallationWebhooks,
    sendWelcomeEmail,
    addContactToSegment,
    notifySlackFeedbackCreated,
    updateSlackFeedbackMessage,
  ],
});
