"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { JiraIcon } from "@workspace/ui/components/icons/jira-icon";
import { toast } from "sonner";
import type { ListFeedbackOutput } from "../../_services/list-feedback";

type JiraIssueBadgeProps = {
  issueLink: ListFeedbackOutput[number]["jiraIssueLink"];
  feedbackId: string;
  hasJiraLink: boolean;
  projectId: string;
};

// Jira exposes a coarse status category rather than a per-project status name,
// so the dot maps on the category and works across arbitrary workflows.
const STATUS_CATEGORY_COLOR: Record<string, string> = {
  new: "bg-muted-foreground",
  indeterminate: "bg-blue-500",
  done: "bg-success",
};

export function JiraIssueBadge({
  issueLink,
  feedbackId,
  hasJiraLink,
  projectId,
}: JiraIssueBadgeProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createIssueMutation = useMutation(
    trpc.authenticated.projects.feedback.createJiraIssue.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.authenticated.projects.feedback.list.queryKey({
            projectId,
          }),
        });
        toast.success("Jira issue creation queued.");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  if (issueLink) {
    const dotColor =
      STATUS_CATEGORY_COLOR[issueLink.issueStatusCategory] ??
      "bg-muted-foreground/60";
    return (
      <a
        href={issueLink.issueUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <span
          className={`size-2 rounded-full ${dotColor}`}
          aria-hidden="true"
        />
        <span>{issueLink.issueKey}</span>
      </a>
    );
  }

  if (!hasJiraLink) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => createIssueMutation.mutate({ feedbackId })}
      disabled={createIssueMutation.isPending}
    >
      <JiraIcon className="mr-1 size-3.5" />
      Create Jira issue
    </Button>
  );
}
