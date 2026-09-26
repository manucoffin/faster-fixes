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
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { GetJiraInstallationOutput } from "../../_services/get-jira-installation";

type JiraConnectedProps = {
  installation: NonNullable<GetJiraInstallationOutput>;
};

export function JiraConnected({ installation }: JiraConnectedProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const disconnectMutation = useMutation(
    trpc.authenticated.integrations.jira.disconnect.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey:
            trpc.authenticated.integrations.jira.getInstallation.queryKey(),
        });
        toast.success("Jira disconnected.");
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
        <span className="font-medium">{installation.siteName}</span>
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
        </span>
      </div>

      {needsReconnect ? (
        <div className="flex flex-col gap-2 rounded-md border border-destructive/50 p-3">
          <span className="text-sm font-medium text-destructive">
            Reconnection required
          </span>
          <span className="text-sm text-muted-foreground">
            The Jira authorization is no longer valid, likely because the
            authorizing user lost access. Reconnect to resume syncing.
          </span>
          <Button size="sm" className="self-start" asChild>
            <a href="/api/jira/install">Reconnect</a>
          </Button>
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" asChild>
          <a
            href={installation.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Jira
            <ExternalLink className="ml-1 size-3" />
          </a>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              Disconnect
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect Jira?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the connection and unlink all projects from
                this Jira site. Existing Jira issues will not be deleted.
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
      </div>
    </div>
  );
}
