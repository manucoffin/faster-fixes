"use client";

import { trpc } from "@/lib/trpc/trpc-client";
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
  const utils = trpc.useUtils();

  const cancelInvitation =
    trpc.authenticated.organisation.invitation.delete.useMutation({
      onSuccess: async () => {
        await utils.authenticated.organisation.invitation.get.invalidate();
        toast.success("Invitation annulée");
      },
      onError: (error) => {
        toast.error(
          error.message || "Erreur lors de l'annulation de l'invitation.",
        );
      },
    });

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
          Annuler l&apos;invitation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
