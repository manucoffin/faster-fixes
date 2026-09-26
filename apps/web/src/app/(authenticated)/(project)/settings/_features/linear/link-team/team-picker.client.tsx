"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
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
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  LinkLinearTeamSchema,
  type LinkLinearTeamInput,
} from "../../../_services/link-linear-team.schema";
import type { ListAccessibleLinearTeamsOutput } from "../../../_services/list-accessible-linear-teams";

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

  const form = useForm<LinkLinearTeamInput>({
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
      onSuccess: async () => {
        await queryClient.invalidateQueries({
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

  const onSubmit = (data: LinkLinearTeamInput) => {
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

        {teamId &&
          matchQueryStatus(statesQuery, {
            Loading: <Skeleton className="h-16 w-full" />,
            Errored: (error) => (
              <Alert variant="destructive">
                <AlertTitle>Failed to load the team states</AlertTitle>
                <AlertDescription>{getErrorMessage(error)}</AlertDescription>
              </Alert>
            ),
            Empty: (
              <p className="text-sm text-muted-foreground">
                This team has no workflow state available.
              </p>
            ),
            Success: ({ data: states }) => (
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
                        {states.map((state) => (
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
            ),
          })}

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
