import { inngest } from "@/server/inngest";
import { createGitHubIssue } from "@/server/inngest/create-github-issue";
import { syncFeedbackStatusToGitHub } from "@/server/inngest/sync-feedback-status-to-github";
import { syncGitHubIssueStatus } from "@/server/inngest/sync-github-issue-status";
import { serve } from "inngest/next";

// Required by v4 checkpointing: client maxRuntime ("50s") must sit below this.
export const maxDuration = 60;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    createGitHubIssue,
    syncGitHubIssueStatus,
    syncFeedbackStatusToGitHub,
  ],
});
