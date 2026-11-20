import { describe, expect, it } from "vitest";
import type { FeedbackStatus } from "@/app/_domains/feedback";
import {
  feedbackStatusFromGitHubIssueState,
  isGitHubIssueStateMirroring,
  resolveGitHubStateToWrite,
  type GitHubIssueState,
  type GitHubStateToWrite,
} from "./status-mapping";

describe("resolveGitHubStateToWrite", () => {
  const rows: Array<{ status: FeedbackStatus; write: GitHubStateToWrite }> = [
    { status: "new", write: { state: "open" } },
    { status: "in_progress", write: { state: "open" } },
    {
      status: "resolved",
      write: { state: "closed", stateReason: "completed" },
    },
    {
      status: "closed",
      write: { state: "closed", stateReason: "not_planned" },
    },
  ];

  it.each(rows)(
    "writes $write.state for a $status Feedback",
    ({ status, write }) => {
      expect(resolveGitHubStateToWrite(status)).toEqual(write);
    },
  );
});

describe("isGitHubIssueStateMirroring", () => {
  const rows: Array<{
    issueState: GitHubIssueState;
    status: FeedbackStatus;
    mirrors: boolean;
  }> = [
    { issueState: "open", status: "new", mirrors: true },
    { issueState: "open", status: "in_progress", mirrors: true },
    { issueState: "open", status: "resolved", mirrors: false },
    { issueState: "open", status: "closed", mirrors: false },
    { issueState: "closed", status: "new", mirrors: false },
    { issueState: "closed", status: "in_progress", mirrors: false },
    { issueState: "closed", status: "resolved", mirrors: true },
    { issueState: "closed", status: "closed", mirrors: true },
  ];

  it.each(rows)(
    "$issueState mirrors $status: $mirrors",
    ({ issueState, status, mirrors }) => {
      expect(isGitHubIssueStateMirroring(issueState, status)).toBe(mirrors);
    },
  );
});

describe("feedbackStatusFromGitHubIssueState", () => {
  const rows: Array<{ issueState: GitHubIssueState; status: FeedbackStatus }> =
    [
      { issueState: "open", status: "in_progress" },
      { issueState: "closed", status: "resolved" },
    ];

  it.each(rows)("$issueState implies $status", ({ issueState, status }) => {
    expect(feedbackStatusFromGitHubIssueState(issueState)).toBe(status);
  });
});
