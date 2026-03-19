"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { MoreHorizontal, X } from "lucide-react";
import { toast } from "sonner";

type InvitationActionsDropdownProps = {
  invitationId: string;
};

export function InvitationActionsDropdown({
  invitationId,
}: InvitationActionsDropdownProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const cancelInvitation = useMutation(
    trpc.authenticated.organization.invitation.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.authenticated.organization.invitation.get.queryFilter(),
        );
        toast.success("Invitation canceled");
      },
      onError: (error) => {
        toast.error(error.message || "Error canceling invitation.");
      },
    }),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={cancelInvitation.isPending}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() => cancelInvitation.mutate({ invitationId })}
          variant="destructive"
        >
          <X className="size-4" />
          Cancel invitation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
