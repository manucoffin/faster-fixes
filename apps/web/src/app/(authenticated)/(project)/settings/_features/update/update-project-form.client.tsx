"use client";

import {
  UpdateProjectInputs,
  UpdateProjectSchema,
} from "@/app/(authenticated)/(project)/settings/_features/update/update-project.schema";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
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
import { Switch } from "@workspace/ui/components/switch";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type UpdateProjectFormProps = {
  projectId: string;
};

export function UpdateProjectForm({ projectId }: UpdateProjectFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: project } = useQuery(
    trpc.authenticated.projects.get.queryOptions({ projectId }),
  );

  const updateProject = useMutation(
    trpc.authenticated.projects.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.authenticated.projects.get.queryOptions({ projectId }),
        );
        queryClient.invalidateQueries({
          queryKey: trpc.authenticated.projects.list.queryKey(),
        });
        toast.success("Project updated");
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
    }),
  );

  const form = useForm<UpdateProjectInputs>({
    resolver: zodResolver(UpdateProjectSchema),
    defaultValues: {
      projectId,
      name: "",
      domain: "",
      widgetEnabled: true,
    },
    values: project
      ? {
          projectId,
          name: project.name,
          domain: project.domain,
          widgetEnabled: project.widgetConfig?.enabled ?? true,
        }
      : undefined,
  });

  const onSubmit = (data: UpdateProjectInputs) => {
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
          <CopyableText className="bg-muted w-fit rounded-md px-3 py-1.5 font-mono text-sm">
            {project?.publicId ?? "..."}
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
