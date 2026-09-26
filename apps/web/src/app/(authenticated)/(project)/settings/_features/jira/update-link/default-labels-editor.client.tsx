"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { useState } from "react";
import { toast } from "sonner";

type DefaultLabelsEditorProps = {
  projectId: string;
  labels: string[];
};

function parseLabels(value: string): string[] {
  return value
    .split(",")
    .map((label) => label.trim())
    .filter((label) => label.length > 0);
}

export function DefaultLabelsEditor({
  projectId,
  labels,
}: DefaultLabelsEditorProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [value, setValue] = useState(labels.join(", "));

  const parsed = parseLabels(value);
  // Jira silently rejects labels with whitespace, so block the save rather than
  // let it fail server-side. Commas are the separator, spaces are never valid.
  const invalidLabels = parsed.filter((label) => /\s/.test(label));

  const updateMutation = useMutation(
    trpc.authenticated.projects.jira.updateLink.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.authenticated.projects.jira.getLink.queryKey({
            projectId,
          }),
        });
        toast.success("Default labels updated.");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="jira-default-labels" className="text-sm">
        Default labels
      </Label>
      <Input
        id="jira-default-labels"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="faster-fixes, triage"
      />
      <p className="text-xs text-muted-foreground">
        Comma-separated. Labels cannot contain spaces.
      </p>
      {invalidLabels.length > 0 && (
        <p className="text-xs text-destructive">
          Remove spaces from: {invalidLabels.join(", ")}
        </p>
      )}
      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        disabled={invalidLabels.length > 0 || updateMutation.isPending}
        onClick={() =>
          updateMutation.mutate({ projectId, defaultLabels: parsed })
        }
      >
        {updateMutation.isPending ? "Saving..." : "Save labels"}
      </Button>
    </div>
  );
}
