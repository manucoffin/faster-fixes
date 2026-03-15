"use client";

import { useActiveOrganization } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { MoreHorizontal, Shield, UserMinus } from "lucide-react";
import { toast } from "sonner";
import type { UpdateMemberRoleInputs } from "./update-role/update-member-role.schema";

type MemberActionsDropdownProps = {
  memberId: string;
  memberRole: string;
  isOwner: boolean;
};

export function MemberActionsDropdown({
  memberId,
  memberRole,
  isOwner,
}: MemberActionsDropdownProps) {
  const trpc = useTRPC();
  const { refetch: refetchActiveOrg } = useActiveOrganization();

  const updateRole =
    useMutation(trpc.authenticated.organisation.member.updateRole.mutationOptions({
      onSuccess: async () => {
        await refetchActiveOrg();
        toast.success("Rôle mis à jour avec succès");
      },
      onError: (error) => {
        toast.error(error.message || "Erreur lors de la modification du rôle.");
      },
    }));

  const removeMember =
    useMutation(trpc.authenticated.organisation.member.delete.mutationOptions({
      onSuccess: async () => {
        await refetchActiveOrg();
        toast.success("Membre retiré avec succès");
      },
      onError: (error) => {
        toast.error(error.message || "Erreur lors du retrait du membre.");
      },
    }));

  const isPending = updateRole.isPending || removeMember.isPending;

  const handleUpdateRole = (newRole: UpdateMemberRoleInputs["role"]) => {
    updateRole.mutate({ memberId, role: newRole });
  };

  const handleRemoveMember = () => {
    removeMember.mutate({ memberId });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isOwner && memberRole !== "admin" && (
          <DropdownMenuItem onSelect={() => handleUpdateRole("admin")}>
            <Shield className="size-4" />
            Promouvoir administrateur
          </DropdownMenuItem>
        )}
        {isOwner && memberRole === "admin" && (
          <DropdownMenuItem onSelect={() => handleUpdateRole("member")}>
            <Shield className="size-4" />
            Rétrograder en membre
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={handleRemoveMember} variant="destructive">
          <UserMinus className="size-4" />
          Retirer le membre
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
