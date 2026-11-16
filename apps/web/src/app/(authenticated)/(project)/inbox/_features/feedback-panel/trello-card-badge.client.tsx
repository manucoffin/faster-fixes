"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { TrelloIcon } from "@workspace/ui/components/icons/trello-icon";
import { toast } from "sonner";
import type { ListFeedbackOutput } from "../../_services/list-feedback";

type TrelloCardBadgeProps = {
  issueLink: ListFeedbackOutput[number]["trelloIssueLink"];
  feedbackId: string;
  hasTrelloLink: boolean;
  projectId: string;
};

export function TrelloCardBadge({
  issueLink,
  feedbackId,
  hasTrelloLink,
  projectId,
}: TrelloCardBadgeProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createCardMutation = useMutation(
    trpc.authenticated.projects.feedback.createTrelloCard.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.authenticated.projects.feedback.list.queryKey({
              projectId,
            }),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.authenticated.projects.video.get.pathKey(),
          }),
        ]);
        toast.success("Trello card creation queued.");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  if (issueLink) {
    return (
      <a
        href={issueLink.cardUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <TrelloIcon className="size-3.5" aria-hidden="true" />
        <span>
          {issueLink.archived ? "Archived Trello card" : "Trello card"}
        </span>
      </a>
    );
  }

  if (!hasTrelloLink) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => createCardMutation.mutate({ feedbackId })}
      disabled={createCardMutation.isPending}
    >
      <TrelloIcon className="mr-1 size-3.5" />
      Create Trello card
    </Button>
  );
}
