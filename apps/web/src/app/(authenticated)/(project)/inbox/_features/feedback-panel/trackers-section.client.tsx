"use client";

import type { ListFeedbackOutput } from "../../_services/list-feedback";
import { GitHubIssueBadge } from "./github-issue-badge.client";
import { JiraIssueBadge } from "./jira-issue-badge.client";
import { LinearIssueBadge } from "./linear-issue-badge.client";

type FeedbackItem = ListFeedbackOutput[number];

type TrackersSectionProps = {
  feedbackId: string;
  projectId: string;
  hasGitHubLink: boolean;
  hasLinearLink: boolean;
  hasJiraLink: boolean;
  githubIssueLink: FeedbackItem["issueLink"];
  linearIssueLink: FeedbackItem["linearIssueLink"];
  jiraIssueLink: FeedbackItem["jiraIssueLink"];
};

export function TrackersSection({
  feedbackId,
  projectId,
  hasGitHubLink,
  hasLinearLink,
  hasJiraLink,
  githubIssueLink,
  linearIssueLink,
  jiraIssueLink,
}: TrackersSectionProps) {
  const showGitHub = hasGitHubLink || githubIssueLink !== null;
  const showLinear = hasLinearLink || linearIssueLink !== null;
  const showJira = hasJiraLink || jiraIssueLink !== null;

  if (!showGitHub && !showLinear && !showJira) return null;

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-xs font-medium text-muted-foreground uppercase">
        Trackers
      </h4>
      <div className="flex flex-col gap-2">
        {showGitHub && (
          <GitHubIssueBadge
            issueLink={githubIssueLink}
            feedbackId={feedbackId}
            hasGitHubLink={hasGitHubLink}
            projectId={projectId}
          />
        )}
        {showLinear && (
          <LinearIssueBadge
            issueLink={linearIssueLink}
            feedbackId={feedbackId}
            hasLinearLink={hasLinearLink}
            projectId={projectId}
          />
        )}
        {showJira && (
          <JiraIssueBadge
            issueLink={jiraIssueLink}
            feedbackId={feedbackId}
            hasJiraLink={hasJiraLink}
            projectId={projectId}
          />
        )}
      </div>
    </div>
  );
}
