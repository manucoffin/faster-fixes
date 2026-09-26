"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { toast } from "sonner";

type SlackEnabledSwitchProps = {
  projectId: string;
  checked: boolean;
};

export function SlackEnabledSwitch({
  projectId,
  checked,
}: SlackEnabledSwitchProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateMutation = useMutation(
    trpc.authenticated.projects.slack.updateLink.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.authenticated.projects.slack.getLink.queryKey({
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
      <Label htmlFor="slack-enabled" className="text-sm">
        Post feedback notifications to Slack
      </Label>
      <Switch
        id="slack-enabled"
        checked={checked}
        onCheckedChange={(value) =>
          updateMutation.mutate({ projectId, enabled: value })
        }
      />
    </div>
  );
}
