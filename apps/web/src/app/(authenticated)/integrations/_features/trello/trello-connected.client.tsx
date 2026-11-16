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
import { toast } from "sonner";
import type { GetTrelloInstallationOutput } from "../../_services/get-trello-installation";

type TrelloConnectedProps = {
  installation: NonNullable<GetTrelloInstallationOutput>;
};

export function TrelloConnected({ installation }: TrelloConnectedProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const disconnectMutation = useMutation(
    trpc.authenticated.integrations.trello.disconnect.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey:
            trpc.authenticated.integrations.trello.getInstallation.queryKey(),
        });
        toast.success("Trello disconnected.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const needsReconnect = installation.healthState === "reconnect_required";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
        <span className="font-medium">
          Authorized as {installation.memberDisplayName}
        </span>
        <span className="text-sm text-muted-foreground">
          Connected
          {installation.installedByName
            ? ` by ${installation.installedByName}`
            : ""}{" "}
          on{" "}
          {new Date(installation.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          . Faster Fixes reaches the boards this Trello member can reach.
        </span>
      </div>

      {needsReconnect ? (
        <div className="flex flex-col gap-2 rounded-md border border-destructive/50 p-3">
          <span className="text-sm font-medium text-destructive">
            Reconnection required
          </span>
          <span className="text-sm text-muted-foreground">
            Trello refused the authorization, likely because the authorizing
            member revoked it or lost access. Reconnect to resume syncing. Your
            linked projects are kept.
          </span>
          <Button size="sm" className="self-start" asChild>
            <a href="/api/trello/install">Reconnect</a>
          </Button>
        </div>
      ) : null}

      {installation.canDisconnect ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="self-start">
              Disconnect
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect Trello?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the connection and unlink all projects from
                their Trello boards. Existing Trello cards will not be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => disconnectMutation.mutate()}>
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <p className="text-sm text-muted-foreground">
          Only the organization owner can disconnect Trello.
        </p>
      )}
    </div>
  );
}
