"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { toast } from "sonner";

type AutoCreateIssuesSwitchProps = {
  projectId: string;
  checked: boolean;
};

export function AutoCreateIssuesSwitch({
  projectId,
  checked,
}: AutoCreateIssuesSwitchProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateMutation = useMutation(
    trpc.authenticated.projects.jira.updateLink.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.authenticated.projects.jira.getLink.queryKey({
            projectId,
          }),
        });
        toast.success("Settings updated.");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  return (
    <div className="flex items-center justify-between">
      <Label htmlFor="jira-auto-create" className="text-sm">
        Auto-create issues from feedback
      </Label>
      <Switch
        id="jira-auto-create"
        checked={checked}
        onCheckedChange={(value) =>
          updateMutation.mutate({ projectId, autoCreateIssues: value })
        }
      />
    </div>
  );
}
