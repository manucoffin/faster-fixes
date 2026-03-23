"use client";

import { useActiveOrganization } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { MoreHorizontal, ShieldOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

type TokenActionsDropdownProps = {
  tokenId: string;
  isActive: boolean;
};

export function TokenActionsDropdown({
  tokenId,
  isActive,
}: TokenActionsDropdownProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: activeOrg } = useActiveOrganization();

  const invalidateTokens = () => {
    queryClient.invalidateQueries({
      queryKey: trpc.authenticated.organization.agentToken.list.queryKey({
        organizationId: activeOrg?.id ?? "",
      }),
    });
  };

  const revokeToken = useMutation(
    trpc.authenticated.organization.agentToken.revoke.mutationOptions({
      onSuccess: () => {
        invalidateTokens();
        toast.success("Token revoked");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const deleteToken = useMutation(
    trpc.authenticated.organization.agentToken.delete.mutationOptions({
      onSuccess: () => {
        invalidateTokens();
        toast.success("Token deleted");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  if (!activeOrg?.id) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isActive && (
          <DropdownMenuItem
            onClick={() =>
              revokeToken.mutate({
                organizationId: activeOrg.id,
                tokenId,
              })
            }
          >
            <ShieldOff className="size-4" />
            Revoke
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          variant="destructive"
          onClick={() =>
            deleteToken.mutate({
              organizationId: activeOrg.id,
              tokenId,
            })
          }
        >
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
