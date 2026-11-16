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
import { Unlink } from "lucide-react";
import { toast } from "sonner";

type UnlinkTrelloBoardButtonProps = {
  projectId: string;
};

export function UnlinkTrelloBoardButton({
  projectId,
}: UnlinkTrelloBoardButtonProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const unlinkMutation = useMutation(
    trpc.authenticated.projects.trello.unlinkBoard.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.authenticated.projects.trello.getLink.queryKey({
            projectId,
          }),
        });
        toast.success("Trello board unlinked.");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-fit">
          <Unlink className="size-3" />
          Unlink Trello board
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unlink Trello board?</AlertDialogTitle>
          <AlertDialogDescription>
            New feedback will no longer create Trello cards, and existing cards
            stop syncing with their feedback. The cards stay on the board, and
            the organization stays connected to Trello. To use another board,
            unlink this one, then link the new one.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => unlinkMutation.mutate({ projectId })}
            variant="destructive"
          >
            Unlink
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
