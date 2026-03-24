"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Github } from "lucide-react";
import { toast } from "sonner";

type GitHubIssueBadgeProps = {
  issueLink: {
    issueNumber: number;
    issueUrl: string;
    issueState: string;
  } | null;
  feedbackId: string;
  hasGitHubLink: boolean;
  projectId: string;
};

export function GitHubIssueBadge({
  issueLink,
  feedbackId,
  hasGitHubLink,
  projectId,
}: GitHubIssueBadgeProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createIssueMutation = useMutation(
    trpc.authenticated.projects.feedback.createIssue.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey:
            trpc.authenticated.projects.feedback.list.queryKey({ projectId }),
        });
        toast.success("GitHub issue creation queued.");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  if (issueLink) {
    return (
      <a
        href={issueLink.issueUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <Github className="size-3.5" />
        <span>#{issueLink.issueNumber}</span>
        <span className="text-xs">
          ({issueLink.issueState})
        </span>
      </a>
    );
  }

  if (!hasGitHubLink) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => createIssueMutation.mutate({ feedbackId })}
      disabled={createIssueMutation.isPending}
    >
      <Github className="mr-1 size-3.5" />
      Create GitHub issue
    </Button>
  );
}
