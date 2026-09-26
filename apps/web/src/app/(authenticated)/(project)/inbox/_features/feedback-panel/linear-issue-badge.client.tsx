"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { LinearIcon } from "@workspace/ui/components/icons/linear-icon";
import { toast } from "sonner";
import type { ListFeedbackOutput } from "../../_services/list-feedback";

type LinearIssueBadgeProps = {
  issueLink: ListFeedbackOutput[number]["linearIssueLink"];
  feedbackId: string;
  hasLinearLink: boolean;
  projectId: string;
};

// The two greys separate backlog from unstarted; the opacity modifier keeps
// them distinguishable while both follow the theme.
const STATE_TYPE_COLOR: Record<string, string> = {
  triage: "bg-purple-500",
  backlog: "bg-muted-foreground/60",
  unstarted: "bg-muted-foreground",
  started: "bg-blue-500",
  completed: "bg-success",
  canceled: "bg-rose-500",
};

export function LinearIssueBadge({
  issueLink,
  feedbackId,
  hasLinearLink,
  projectId,
}: LinearIssueBadgeProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createIssueMutation = useMutation(
    trpc.authenticated.projects.feedback.createLinearIssue.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.authenticated.projects.feedback.list.queryKey({
            projectId,
          }),
        });
        toast.success("Linear issue creation queued.");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  if (issueLink) {
    const dotColor =
      STATE_TYPE_COLOR[issueLink.issueStateType] ?? "bg-muted-foreground/60";
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
        <span>{issueLink.issueIdentifier}</span>
      </a>
    );
  }

  if (!hasLinearLink) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => createIssueMutation.mutate({ feedbackId })}
      disabled={createIssueMutation.isPending}
    >
      <LinearIcon className="mr-1 size-3.5" />
      Create Linear issue
    </Button>
  );
}
