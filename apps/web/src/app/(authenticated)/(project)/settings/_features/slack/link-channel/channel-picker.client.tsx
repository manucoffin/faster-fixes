"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { useState } from "react";
import { toast } from "sonner";
import type { ListSlackChannelsOutput } from "../../../_services/list-slack-channels";

type ChannelPickerProps = {
  projectId: string;
  channels: ListSlackChannelsOutput;
  selectedChannelId: string;
};

export function ChannelPicker({
  projectId,
  channels,
  selectedChannelId,
}: ChannelPickerProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [channelId, setChannelId] = useState<string>(selectedChannelId);

  const setChannelMutation = useMutation(
    trpc.authenticated.projects.slack.linkChannel.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.authenticated.projects.slack.getLink.queryKey({
            projectId,
          }),
        });
        toast.success("Channel updated.");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm">Notification channel</Label>
      <Select
        value={channelId}
        onValueChange={(value) => {
          setChannelId(value);
          const channel = channels.find((c) => c.id === value);
          setChannelMutation.mutate({
            projectId,
            channelId: value,
            channelName: channel?.name ?? "",
          });
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a channel" />
        </SelectTrigger>
        <SelectContent>
          {channels.map((channel) => (
            <SelectItem key={channel.id} value={channel.id}>
              #{channel.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
