"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

type RestoreReviewerButtonProps = {
  projectId: string;
  reviewerId: string;
};

export function RestoreReviewerButton({
  projectId,
  reviewerId,
}: RestoreReviewerButtonProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const restoreReviewer = useMutation(
    trpc.authenticated.projects.reviewer.restore.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.authenticated.projects.reviewer.list.queryOptions({ projectId }),
        );
        toast.success("Reviewer restored");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={restoreReviewer.isPending}
      onClick={() => restoreReviewer.mutate({ reviewerId })}
    >
      <RotateCcw className="size-4" />
      Restore
    </Button>
  );
}
