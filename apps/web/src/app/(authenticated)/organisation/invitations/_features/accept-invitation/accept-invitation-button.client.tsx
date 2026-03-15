"use client";

import { organization, useListOrganizations } from "@/lib/auth";
import { trpc } from "@/lib/trpc/trpc-client";
import { Button } from "@workspace/ui/components/button";
import { Check } from "lucide-react";
import { toast } from "sonner";

type AcceptInvitationButtonProps = {
  invitationId: string;
  organizationId: string;
};

export function AcceptInvitationButton({
  invitationId,
  organizationId,
}: AcceptInvitationButtonProps) {
  const { refetch: refetchOrganizations } = useListOrganizations();
  const utils = trpc.useUtils();

  const acceptMutation =
    trpc.authenticated.organisation.invitation.accept.useMutation({
      onSuccess: async () => {
        toast.success("Invitation acceptée");

        await organization.setActive({ organizationId });
        await refetchOrganizations();
        utils.authenticated.organisation.invitation.getReceived.invalidate();
      },
      onError: (error) => {
        toast.error(
          error.message || "Erreur lors de l'acceptation de l'invitation.",
        );
      },
    });

  return (
    <Button
      size="sm"
      disabled={acceptMutation.isPending}
      onClick={() => acceptMutation.mutate({ invitationId })}
      className="flex-1"
    >
      <Check className="size-4" />
      Accepter
    </Button>
  );
}
