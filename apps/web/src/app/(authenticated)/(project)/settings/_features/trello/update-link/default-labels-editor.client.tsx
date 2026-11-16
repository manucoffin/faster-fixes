"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Label } from "@workspace/ui/components/label";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useState } from "react";
import { toast } from "sonner";
import type { ListTrelloBoardLabelsOutput } from "../../../_services/list-trello-board-labels";

type DefaultLabelsEditorProps = {
  projectId: string;
  labelIds: string[];
};

export function DefaultLabelsEditor({
  projectId,
  labelIds,
}: DefaultLabelsEditorProps) {
  const trpc = useTRPC();

  const labelsQuery = useQuery(
    trpc.authenticated.projects.trello.listBoardLabels.queryOptions({
      projectId,
    }),
  );

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Default labels</p>
      {matchQueryStatus(labelsQuery, {
        Loading: <Skeleton className="h-16 w-full" />,
        Errored: (error) => (
          <Alert variant="destructive">
            <AlertDescription>{getErrorMessage(error)}</AlertDescription>
          </Alert>
        ),
        Empty: (
          <p className="text-sm text-muted-foreground">
            This Trello board has no labels. Add labels in Trello to apply them
            to new cards.
          </p>
        ),
        Success: ({ data: labels }) => (
          <LabelChoices
            projectId={projectId}
            labels={labels}
            labelIds={labelIds}
          />
        ),
      })}
    </div>
  );
}

type LabelChoicesProps = {
  projectId: string;
  labels: ListTrelloBoardLabelsOutput;
  labelIds: string[];
};

function LabelChoices({ projectId, labels, labelIds }: LabelChoicesProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  // A label deleted in Trello is dropped on the next save.
  const [selected, setSelected] = useState(
    () => new Set(labelIds.filter((id) => labels.some((l) => l.id === id))),
  );

  const updateMutation = useMutation(
    trpc.authenticated.projects.trello.updateLink.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.authenticated.projects.trello.getLink.queryKey({
            projectId,
          }),
        });
        toast.success("Default labels updated.");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const toggle = (labelId: string, checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(labelId);
      else next.delete(labelId);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {labels.map((label) => (
          <div key={label.id} className="flex items-center gap-2">
            <Checkbox
              id={`trello-label-${label.id}`}
              checked={selected.has(label.id)}
              onCheckedChange={(checked) => toggle(label.id, checked === true)}
            />
            <Label htmlFor={`trello-label-${label.id}`} className="text-sm">
              {describeLabel(label)}
            </Label>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Applied to every new card created from feedback.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        disabled={updateMutation.isPending}
        onClick={() =>
          updateMutation.mutate({ projectId, defaultLabelIds: [...selected] })
        }
      >
        {updateMutation.isPending ? "Saving..." : "Save labels"}
      </Button>
    </div>
  );
}

// Trello labels can be a color with no name.
function describeLabel(label: ListTrelloBoardLabelsOutput[number]) {
  if (label.name) return label.name;
  if (label.color) return `Unnamed ${label.color.replace(/_/g, " ")} label`;
  return "Unnamed label";
}
