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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { CopyableText } from "@workspace/ui/components/copyable-text";
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
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="widgetEnabled"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Widget enabled</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={updateProject.isPending}
                  />
                </FormControl>
              </div>
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
