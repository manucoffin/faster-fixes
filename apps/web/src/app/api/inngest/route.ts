import { inngest } from "@/server/inngest";
import { addContactToSegment } from "@/server/inngest/add-contact-to-segment";
import { createGitHubIssue } from "@/app/_domains/integration/_services/github/create-github-issue.inngest";
import { createJiraIssue } from "@/server/inngest/create-jira-issue";
import { createLinearIssue } from "@/app/_domains/integration/_services/linear/create-linear-issue.inngest";
import { handleJiraOAuthRevoked } from "@/server/inngest/handle-jira-oauth-revoked";
import { handleLinearOAuthRevoked } from "@/app/_domains/integration/_services/linear/handle-linear-oauth-revoked.inngest";
import { notifySlackFeedbackCreated } from "@/server/inngest/notify-slack-feedback-created";
import { refreshJiraInstallationWebhooks } from "@/server/inngest/refresh-jira-installation-webhooks";
import { refreshJiraWebhooks } from "@/server/inngest/refresh-jira-webhooks";
import { sendWelcomeEmail } from "@/server/inngest/send-welcome-email";
import { syncFeedbackStatusToGitHub } from "@/app/_domains/integration/_services/github/sync-feedback-status-to-github.inngest";
import { syncFeedbackStatusToJira } from "@/server/inngest/sync-feedback-status-to-jira";
import { syncFeedbackStatusToLinear } from "@/app/_domains/integration/_services/linear/sync-feedback-status-to-linear.inngest";
import { syncGitHubIssueStatus } from "@/app/_domains/integration/_services/github/sync-github-issue-status.inngest";
import { syncJiraIssueStatus } from "@/server/inngest/sync-jira-issue-status";
import { syncLinearIssueStatus } from "@/app/_domains/integration/_services/linear/sync-linear-issue-status.inngest";
import { updateSlackFeedbackMessage } from "@/server/inngest/update-slack-feedback-message";
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
