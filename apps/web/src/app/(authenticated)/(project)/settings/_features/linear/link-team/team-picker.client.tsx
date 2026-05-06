"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
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
import type { ListAccessibleLinearTeamsOutput } from "./list-accessible-teams.trpc.query";

type TeamPickerProps = {
  projectId: string;
  teams: ListAccessibleLinearTeamsOutput;
};

const PRIORITY_OPTIONS: { value: 0 | 1 | 2 | 3 | 4; label: string }[] = [
  { value: 0, label: "No priority" },
  { value: 1, label: "Urgent" },
  { value: 2, label: "High" },
  { value: 3, label: "Medium" },
  { value: 4, label: "Low" },
];

export function TeamPicker({ projectId, teams }: TeamPickerProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [teamId, setTeamId] = useState<string>("");
  const [stateId, setStateId] = useState<string>("");
  const [priority, setPriority] = useState<0 | 1 | 2 | 3 | 4>(0);

  const statesQuery = useQuery(
    trpc.authenticated.projects.linear.listTeamStates.queryOptions(
      { teamId },
      { enabled: !!teamId },
    ),
  );

  const linkMutation = useMutation(
    trpc.authenticated.projects.linear.linkTeam.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.authenticated.projects.linear.getLink.queryKey({
            projectId,
          }),
        });
        toast.success("Team linked.");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const handleLink = () => {
    const team = teams.find((t) => t.id === teamId);
    if (!team || !stateId) return;

    linkMutation.mutate({
      projectId,
      teamId: team.id,
      teamKey: team.key,
      teamName: team.name,
      defaultStateId: stateId,
      defaultLabelIds: [],
      defaultPriority: priority,
      autoCreateIssues: true,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Team</Label>
        <Select
          value={teamId}
          onValueChange={(v) => {
            setTeamId(v);
            setStateId("");
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a team" />
          </SelectTrigger>
          <SelectContent>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.key} · {team.name}
              </SelectItem>
            ))}
            {teams.length === 0 && (
              <SelectItem value="_empty" disabled>
                No teams available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {teamId && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm">Default state for new feedback</Label>
          <Select value={stateId} onValueChange={setStateId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a state" />
            </SelectTrigger>
            <SelectContent>
              {statesQuery.data?.map((state) => (
                <SelectItem key={state.id} value={state.id}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Default priority</Label>
        <Select
          value={String(priority)}
          onValueChange={(v) => setPriority(Number(v) as 0 | 1 | 2 | 3 | 4)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleLink}
        disabled={!teamId || !stateId || linkMutation.isPending}
        className="w-fit"
      >
        Link team
      </Button>
    </div>
  );
}
