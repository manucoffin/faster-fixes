"use client";

import { format, formatDistanceToNow } from "date-fns";
import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import {
  formatEnvironment,
  formatPagePath,
} from "../../_helpers/feedback-detail";
import type { ListFeedbackOutput } from "../../_services/list-feedback";
import { AssigneeSelect } from "./assignee-select.client";
import { CopyFeedbackMarkdown } from "./copy-feedback-markdown.client";
import { CustomMetadataSection } from "./custom-metadata-section.client";
import { StatusSelect } from "./status-select.client";
import { TrackersSection } from "./trackers-section.client";
import { ViewDiagnosticsDialog } from "./view-diagnostics-dialog.client";

type FeedbackItem = ListFeedbackOutput[number];

type FeedbackPropertiesRailProps = {
  feedback: FeedbackItem;
  projectId: string;
  hasGitHubLink: boolean;
  hasLinearLink: boolean;
  hasJiraLink: boolean;
};

export function FeedbackPropertiesRail({
  feedback,
  projectId,
  hasGitHubLink,
  hasLinearLink,
  hasJiraLink,
}: FeedbackPropertiesRailProps) {
  const environment = formatEnvironment(feedback);

  return (
    <aside className="flex flex-col gap-5 border-t bg-muted/30 p-5 md:border-t-0 md:border-l md:pt-12">
      <Property label="Status">
        <StatusSelect feedbackId={feedback.id} value={feedback.status} />
      </Property>

      <AssigneeSelect
        feedbackId={feedback.id}
        value={feedback.assignee?.id ?? null}
      />

      <TrackersSection
        feedbackId={feedback.id}
        projectId={projectId}
        hasGitHubLink={hasGitHubLink}
        hasLinearLink={hasLinearLink}
        hasJiraLink={hasJiraLink}
        githubIssueLink={feedback.issueLink}
        linearIssueLink={feedback.linearIssueLink}
        jiraIssueLink={feedback.jiraIssueLink}
      />

      <div className="h-px bg-border" />

      <Property label="Page">
        <a
          href={feedback.pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex max-w-full items-center gap-1 text-sm text-primary hover:underline"
          title={feedback.pageUrl}
        >
          <span className="truncate">{formatPagePath(feedback.pageUrl)}</span>
          <ExternalLink className="size-3 shrink-0" />
        </a>
      </Property>

      <Property label="Reported by">
        <span className="text-sm">{feedback.reviewer.name}</span>
        <span className="text-xs text-muted-foreground">
          {format(new Date(feedback.createdAt), "MMM d, yyyy")}, updated{" "}
          {formatDistanceToNow(new Date(feedback.updatedAt), {
            addSuffix: true,
          })}
        </span>
      </Property>

      <Property label="Environment">
        <span className="text-sm">
          {environment.browser ?? "Unknown browser"}
        </span>
        {environment.details && (
          <span className="text-xs text-muted-foreground">
            {environment.details}
          </span>
        )}
      </Property>

      <CustomMetadataSection customMetadata={feedback.customMetadata} />

      <div className="mt-auto flex flex-col gap-2">
        <ViewDiagnosticsDialog projectId={projectId} feedbackId={feedback.id} />
        <CopyFeedbackMarkdown feedback={feedback} />
      </div>
    </aside>
  );
}

type PropertyProps = {
  label: string;
  children: ReactNode;
};

function Property({ label, children }: PropertyProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <h4 className="text-xs font-medium text-muted-foreground uppercase">
        {label}
      </h4>
      <div className="flex min-w-0 flex-col items-start gap-0.5">
        {children}
      </div>
    </div>
  );
}
