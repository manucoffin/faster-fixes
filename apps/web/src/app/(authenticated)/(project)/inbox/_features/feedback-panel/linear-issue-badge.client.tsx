"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { LinearIcon } from "@workspace/ui/components/icons/linear-icon";
import { toast } from "sonner";
import type { GetFeedbackOutput } from "../get-feedback.trpc.query";

type LinearIssueBadgeProps = {
  issueLink: GetFeedbackOutput[number]["linearIssueLink"];
  feedbackId: string;
  hasLinearLink: boolean;
  projectId: string;
};

const STATE_TYPE_COLOR: Record<string, string> = {
  triage: "bg-purple-500",
  backlog: "bg-slate-400",
  unstarted: "bg-slate-500",
  started: "bg-blue-500",
  completed: "bg-emerald-500",
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
      onSuccess: () => {
        queryClient.invalidateQueries({
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
      STATE_TYPE_COLOR[issueLink.issueStateType] ?? "bg-slate-400";
    return (
      <a
        href={issueLink.issueUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <span className={`size-2 rounded-full ${dotColor}`} aria-hidden="true" />
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
