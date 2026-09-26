"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useState } from "react";
import { toast } from "sonner";

// Shown when the OAuth grant covered several Jira sites. The user picks exactly
// one to store for the Organization before the integration is usable.
export function JiraSelectSite() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);

  const sitesQuery = useQuery(
    trpc.authenticated.integrations.jira.listAccessibleSites.queryOptions(),
  );

  const selectMutation = useMutation(
    trpc.authenticated.integrations.jira.selectSite.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey:
            trpc.authenticated.integrations.jira.getInstallation.queryKey(),
        });
        toast.success("Jira site connected.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Your Atlassian account can access several Jira sites. Choose the one to
        connect to this organization.
      </p>

      {matchQueryStatus(sitesQuery, {
        Loading: <Skeleton className="h-16 w-full" />,
        Errored: (
          <p className="text-sm text-destructive">
            Failed to load your Jira sites. Try refreshing the page.
          </p>
        ),
        Empty: (
          <p className="text-sm text-muted-foreground">
            No accessible Jira sites found.
          </p>
        ),
        Success: ({ data: sites }) => (
          <>
            <RadioGroup
              value={selected ?? undefined}
              onValueChange={setSelected}
            >
              {sites.map((site) => (
                <div key={site.cloudId} className="flex items-center gap-3">
                  <RadioGroupItem value={site.cloudId} id={site.cloudId} />
                  <Label
                    htmlFor={site.cloudId}
                    className="flex flex-col items-start gap-0.5"
                  >
                    <span className="font-medium">{site.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {site.url}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <Button
              className="self-start"
              disabled={!selected || selectMutation.isPending}
              onClick={() =>
                selected && selectMutation.mutate({ cloudId: selected })
              }
            >
              Connect site
            </Button>
          </>
        ),
      })}
    </div>
  );
}
