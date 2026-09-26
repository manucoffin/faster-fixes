"use client";

import type { GetProjectOutput } from "@/app/(authenticated)/(project)/settings/_services/get-project";
import type { UpdateProjectInput } from "@/app/(authenticated)/(project)/settings/_services/update-project.schema";
import { UpdateProjectSchema } from "@/app/(authenticated)/(project)/settings/_services/update-project.schema";
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
import { CopyableText } from "@workspace/ui/components/copyable-text";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@workspace/ui/components/field";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Separator } from "@workspace/ui/components/separator";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Switch } from "@workspace/ui/components/switch";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type UpdateProjectFormProps = {
  projectId: string;
};

export function UpdateProjectForm({ projectId }: UpdateProjectFormProps) {
  const trpc = useTRPC();

  const projectQuery = useQuery(
    trpc.authenticated.projects.get.queryOptions({ projectId }),
  );

  return matchQueryStatus(projectQuery, {
    Loading: (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    ),
    Errored: (error) => (
      <Alert variant="destructive">
        <AlertTitle>Failed to load the project</AlertTitle>
        <AlertDescription>{getErrorMessage(error)}</AlertDescription>
      </Alert>
    ),
    // The service throws when the Project is missing, so this branch only
    // narrows the loaded data for the fields below.
    Empty: (
      <p className="text-sm text-muted-foreground">
        This project is unavailable.
      </p>
    ),
    Success: ({ data: project }) => (
      <UpdateProjectFields projectId={projectId} project={project} />
    ),
  });
}

type UpdateProjectFieldsProps = {
  projectId: string;
  project: GetProjectOutput;
};

function UpdateProjectFields({ projectId, project }: UpdateProjectFieldsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateProject = useMutation(
    trpc.authenticated.projects.update.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries(
            trpc.authenticated.projects.get.queryOptions({ projectId }),
          ),
          queryClient.invalidateQueries({
            queryKey: trpc.authenticated.projects.list.queryKey(),
          }),
        ]);
        toast.success("Project updated");
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
    }),
  );

  const form = useForm<UpdateProjectInput>({
    resolver: zodResolver(UpdateProjectSchema),
    values: {
      projectId,
      name: project.name,
      domain: project.domain,
      widgetEnabled: project.widgetConfig?.enabled ?? true,
    },
  });

  const onSubmit = (data: UpdateProjectInput) => {
    updateProject.mutate(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        {form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Project ID</Label>
          <CopyableText className="w-fit rounded-md bg-muted px-3 py-1.5 font-mono text-sm">
            {project.publicId}
          </CopyableText>
        </div>

        <Separator />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project name</FormLabel>
              <FormControl>
                <Input disabled={updateProject.isPending} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="domain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Domain</FormLabel>
              <FormControl>
                <Input
                  placeholder="client.com"
                  disabled={updateProject.isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Subdomains, www., and protocol variants are matched
                automatically. Localhost is always allowed for local
                development.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="widgetEnabled"
          render={({ field }) => (
            <FormItem>
              <FieldLabel htmlFor="widget-enabled-switch">
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>Widget enabled</FieldTitle>
                    <FieldDescription>
                      Show the feedback widget on your site. Disable to hide it
                      without removing the snippet.
                    </FieldDescription>
                  </FieldContent>
                  <FormControl>
                    <Switch
                      id="widget-enabled-switch"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={updateProject.isPending}
                    />
                  </FormControl>
                </Field>
              </FieldLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={updateProject.isPending}
          className="self-end"
        >
          {updateProject.isPending ? "Updating..." : "Update"}
        </Button>
      </form>
    </Form>
  );
}
