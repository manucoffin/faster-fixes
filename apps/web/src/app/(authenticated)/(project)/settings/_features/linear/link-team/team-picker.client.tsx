"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  LinkLinearTeamSchema,
  type LinkLinearTeamSchemaType,
} from "./link-team.schema";
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

  const form = useForm<LinkLinearTeamSchemaType>({
    resolver: zodResolver(LinkLinearTeamSchema),
    defaultValues: {
      projectId,
      teamId: "",
      teamKey: "",
      teamName: "",
      defaultStateId: "",
      defaultLabelIds: [],
      defaultPriority: 0,
      autoCreateIssues: true,
    },
  });

  const teamId = form.watch("teamId");

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
      onError: (error) => {
        form.setError("root", { message: error.message });
        toast.error(error.message);
      },
    }),
  );

  const onSubmit = (data: LinkLinearTeamSchemaType) => {
    linkMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="teamId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  const team = teams.find((t) => t.id === value);
                  if (!team) return;
                  field.onChange(team.id);
                  // Team change invalidates dependent IDs from the previous team.
                  form.setValue("teamKey", team.key);
                  form.setValue("teamName", team.name);
                  form.setValue("defaultStateId", "");
                  form.setValue("defaultLabelIds", []);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                </FormControl>
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
              <FormMessage />
            </FormItem>
          )}
        />

        {teamId && (
          <FormField
            control={form.control}
            name="defaultStateId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default state for new feedback</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a state" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statesQuery.data?.map((state) => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="defaultPriority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default priority</FormLabel>
              <Select
                value={String(field.value)}
                onValueChange={(value) =>
                  field.onChange(Number(value) as 0 | 1 | 2 | 3 | 4)
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={linkMutation.isPending}
          className="w-fit"
        >
          {linkMutation.isPending ? "Linking..." : "Link team"}
        </Button>
      </form>
    </Form>
  );
}
