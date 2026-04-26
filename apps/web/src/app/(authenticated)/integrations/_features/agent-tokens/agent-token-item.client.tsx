"use client";

import { useActiveOrganization } from "@/lib/auth";
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
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { ShieldOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { GetAgentTokensOutput } from "./get-agent-tokens.trpc.query";

type AgentTokenItemProps = {
  token: GetAgentTokensOutput[number];
};

function formatDate(date: Date | string | null): string {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatScopes(scopes: string[]): string {
  return scopes
    .map((s) => {
      switch (s) {
        case "feedbacks:read":
          return "Read";
        case "feedbacks:update_status":
          return "Update status";
        case "feedbacks:create":
          return "Create";
        default:
          return s;
      }
    })
    .join(", ");
}

export function AgentTokenItem({ token }: AgentTokenItemProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: activeOrg } = useActiveOrganization();

  const invalidateTokens = () => {
    queryClient.invalidateQueries({
      queryKey: trpc.authenticated.integrations.agentToken.list.queryKey({
        organizationId: activeOrg?.id ?? "",
      }),
    });
  };

  const revokeToken = useMutation(
    trpc.authenticated.integrations.agentToken.revoke.mutationOptions({
      onSuccess: () => {
        invalidateTokens();
        toast.success("Token revoked");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const deleteToken = useMutation(
    trpc.authenticated.integrations.agentToken.delete.mutationOptions({
      onSuccess: () => {
        invalidateTokens();
        toast.success("Token deleted");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  if (!activeOrg?.id) return null;

  return (
    <div className="flex items-start gap-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-medium">{token.name}</span>
        <code className="text-muted-foreground text-xs">
          ff_agent_••••{token.tokenLastFour}
        </code>
        <div className="text-muted-foreground text-xs">
          {formatScopes(token.scopes)} · Last used{" "}
          {formatDate(token.lastUsedAt)}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={token.isActive ? "default" : "destructive"}>
          {token.isActive ? "Active" : "Revoked"}
        </Badge>

        <div className="flex shrink-0 gap-1">
          {token.isActive && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <ShieldOff className="size-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Revoke token?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will immediately invalidate the token. Any agent using
                    it will lose access.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      revokeToken.mutate({
                        organizationId: activeOrg.id,
                        tokenId: token.id,
                      })
                    }
                    variant="destructive"
                  >
                    Revoke
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <Trash2 className="size-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete token?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the token. This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    deleteToken.mutate({
                      organizationId: activeOrg.id,
                      tokenId: token.id,
                    })
                  }
                  variant="destructive"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
