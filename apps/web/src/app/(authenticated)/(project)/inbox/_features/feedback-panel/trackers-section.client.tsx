"use client";

import { GitHubIssueBadge } from "./github-issue-badge.client";
import { LinearIssueBadge } from "./linear-issue-badge.client";

type GitHubIssueLink = {
  issueNumber: number;
  issueUrl: string;
  issueState: string;
};

type LinearIssueLink = {
  issueId: string;
  issueIdentifier: string;
  issueUrl: string;
  issueStateType: string;
};

type TrackersSectionProps = {
  feedbackId: string;
  projectId: string;
  hasGitHubLink: boolean;
  hasLinearLink: boolean;
  githubIssueLink: GitHubIssueLink | null;
  linearIssueLink: LinearIssueLink | null;
};

export function TrackersSection({
  feedbackId,
  projectId,
  hasGitHubLink,
  hasLinearLink,
  githubIssueLink,
  linearIssueLink,
}: TrackersSectionProps) {
  const showGitHub = hasGitHubLink || githubIssueLink !== null;
  const showLinear = hasLinearLink || linearIssueLink !== null;

  if (!showGitHub && !showLinear) return null;

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-muted-foreground text-xs font-medium uppercase">
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
      </div>
    </div>
  );
}
