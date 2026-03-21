"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { UserX } from "lucide-react";
import { toast } from "sonner";

type RevokeReviewerButtonProps = {
  projectId: string;
  reviewerId: string;
  reviewerName: string;
};

export function RevokeReviewerButton({
  projectId,
  reviewerId,
  reviewerName,
}: RevokeReviewerButtonProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const revokeReviewer = useMutation(
    trpc.authenticated.projects.reviewer.revoke.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.authenticated.projects.reviewer.list.queryOptions({ projectId }),
        );
        toast.success("Reviewer revoked");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
        >
          <UserX className="size-4" />
          Revoke
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke reviewer</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to revoke access for{" "}
            <span className="font-medium">{reviewerName}</span>? They will no
            longer be able to submit feedback.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => revokeReviewer.mutate({ reviewerId })}
            variant="destructive"
          >
            Revoke
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
