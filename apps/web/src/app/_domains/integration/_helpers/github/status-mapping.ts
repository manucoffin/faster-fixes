// Translates between Feedback statuses and GitHub Issue states, in both
// directions. GitHub has two states, open or closed; the close reason tells
// Resolved and Archived apart on the way out only (ADR-0025).

import type { FeedbackStatus } from "@/app/_domains/feedback";

export type GitHubIssueState = "open" | "closed";

export type GitHubStateToWrite = {
  state: GitHubIssueState;
  stateReason?: "completed" | "not_planned";
};

export function resolveGitHubStateToWrite(
  status: FeedbackStatus,
): GitHubStateToWrite {
  if (status === "resolved") {
    return { state: "closed", stateReason: "completed" };
  }
  if (status === "closed") {
    return { state: "closed", stateReason: "not_planned" };
  }
  return { state: "open" };
}

// One state mirrors several Statuses: closed mirrors Resolved and Archived,
// open mirrors `new` and In progress.
export function isGitHubIssueStateMirroring(
  issueState: GitHubIssueState,
  status: FeedbackStatus,
): boolean {
  return resolveGitHubStateToWrite(status).state === issueState;
}

// Reopening implies In progress, not `new`: someone has looked at the Issue.
export function feedbackStatusFromGitHubIssueState(
  issueState: GitHubIssueState,
): FeedbackStatus {
  return issueState === "closed" ? "resolved" : "in_progress";
}
