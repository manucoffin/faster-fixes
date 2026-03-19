"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { X } from "lucide-react";
import { toast } from "sonner";

type RejectInvitationButtonProps = {
  invitationId: string;
};

export function RejectInvitationButton({
  invitationId,
}: RejectInvitationButtonProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const rejectMutation =
    useMutation(trpc.authenticated.organisation.invitation.reject.mutationOptions({
      onSuccess: () => {
        toast.success("Invitation refusée");
        queryClient.invalidateQueries(trpc.authenticated.organisation.invitation.getReceived.queryFilter());
      },
      onError: (error) => {
        toast.error(error.message || "Erreur lors du refus de l'invitation.");
      },
    }));

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={rejectMutation.isPending}
      onClick={() => rejectMutation.mutate({ invitationId })}
      className="flex-1"
    >
      <X className="size-4" />
      Refuser
    </Button>
  );
}
