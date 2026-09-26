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
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
  LinkJiraProjectSchema,
  type LinkJiraProjectInput,
} from "../../../_services/link-jira-project.schema";
import type { ListAccessibleJiraProjectsOutput } from "../../../_services/list-accessible-jira-projects";

type JiraProjectPickerProps = {
  projectId: string;
  jiraProjects: ListAccessibleJiraProjectsOutput;
};

export function JiraProjectPicker({
  projectId,
  jiraProjects,
}: JiraProjectPickerProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<LinkJiraProjectInput>({
    resolver: zodResolver(LinkJiraProjectSchema),
    defaultValues: {
      projectId,
      jiraProjectId: "",
      jiraProjectKey: "",
      jiraProjectName: "",
      issueTypeId: "",
      issueTypeName: "",
      autoCreateIssues: true,
      defaultLabels: ["faster-fixes"],
    },
  });

  const jiraProjectId = useWatch({
    control: form.control,
    name: "jiraProjectId",
  });
  const issueTypeId = useWatch({ control: form.control, name: "issueTypeId" });

  const issueTypesQuery = useQuery(
    trpc.authenticated.projects.jira.listIssueTypes.queryOptions(
      { projectId, jiraProjectId },
      { enabled: !!jiraProjectId },
    ),
  );

  const issueTypes = issueTypesQuery.data;

  // "Bug" is the right default for feedback in almost every Jira project, so
  // pre-select it once the types for the chosen project arrive.
  useEffect(() => {
    if (!issueTypes || issueTypeId) return;
    const bug = issueTypes.find((type) => type.name === "Bug");
    if (!bug) return;
    /* eslint-disable local/no-form-mutation-in-effect -- a default that waits for the async list, and never replaces a type the user picked */
    form.setValue("issueTypeId", bug.id);
    form.setValue("issueTypeName", bug.name);
    /* eslint-enable local/no-form-mutation-in-effect -- end of the default above */
  }, [issueTypes, issueTypeId, form]);

  const linkMutation = useMutation(
    trpc.authenticated.projects.jira.linkProject.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.authenticated.projects.jira.getLink.queryKey({
            projectId,
          }),
        });
        toast.success("Jira project linked.");
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
        toast.error(error.message);
      },
    }),
  );

  const onSubmit = (data: LinkJiraProjectInput) => {
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
          name="jiraProjectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jira project</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  const jiraProject = jiraProjects.find((p) => p.id === value);
                  if (!jiraProject) return;
                  field.onChange(jiraProject.id);
                  form.setValue("jiraProjectKey", jiraProject.key);
                  form.setValue("jiraProjectName", jiraProject.name);
                  // Issue types are scoped to a Jira project; the previous
                  // selection does not exist in the new one.
                  form.setValue("issueTypeId", "");
                  form.setValue("issueTypeName", "");
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Jira project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {jiraProjects.map((jiraProject) => (
                    <SelectItem key={jiraProject.id} value={jiraProject.id}>
                      {jiraProject.key} · {jiraProject.name}
                    </SelectItem>
                  ))}
                  {jiraProjects.length === 0 && (
                    <SelectItem value="_empty" disabled>
                      No Jira projects available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {jiraProjectId &&
          matchQueryStatus(issueTypesQuery, {
            Loading: <Skeleton className="h-16 w-full" />,
            Errored: (error) => (
              <Alert variant="destructive">
                <AlertTitle>Failed to load the issue types</AlertTitle>
                <AlertDescription>{getErrorMessage(error)}</AlertDescription>
              </Alert>
            ),
            Empty: (
              <p className="text-sm text-muted-foreground">
                This Jira project has no issue type available.
              </p>
            ),
            Success: ({ data: availableIssueTypes }) => (
              <FormField
                control={form.control}
                name="issueTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        const issueType = availableIssueTypes.find(
                          (t) => t.id === value,
                        );
                        if (!issueType) return;
                        field.onChange(issueType.id);
                        form.setValue("issueTypeName", issueType.name);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an issue type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableIssueTypes.map((issueType) => (
                          <SelectItem key={issueType.id} value={issueType.id}>
                            {issueType.name}
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

        {form.formState.errors.root && (
          <p className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button
          type="submit"
          disabled={linkMutation.isPending}
          className="w-fit"
        >
          {linkMutation.isPending ? "Linking..." : "Link Jira project"}
        </Button>
      </form>
    </Form>
  );
}
