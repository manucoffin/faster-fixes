"use client";

import {
  UpdateProjectInputs,
  UpdateProjectSchema,
} from "@/app/(authenticated)/projects/[projectId]/_features/settings/update/update-project.schema";
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
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type UpdateProjectFormProps = {
  projectId: string;
};

export function UpdateProjectForm({ projectId }: UpdateProjectFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: project } = useQuery(
    trpc.authenticated.projets.get.queryOptions({ projectId }),
  );

  const updateProject = useMutation(
    trpc.authenticated.projets.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.authenticated.projets.get.queryOptions({ projectId }),
        );
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
      url: "",
      widgetColor: "#6366f1",
      widgetPosition: "bottom-right",
    },
    values: project
      ? {
          projectId,
          name: project.name,
          url: project.url,
          widgetColor: project.widgetConfig?.color ?? "#6366f1",
          widgetPosition:
            (project.widgetConfig
              ?.position as UpdateProjectInputs["widgetPosition"]) ??
            "bottom-right",
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
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
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
          name="widgetColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Widget color</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    disabled={updateProject.isPending}
                    className="h-10 w-12 cursor-pointer rounded border"
                    {...field}
                  />
                  <Input
                    className="flex-1"
                    placeholder="#6366f1"
                    disabled={updateProject.isPending}
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="widgetPosition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Widget position</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={updateProject.isPending}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="top-right">Top right</SelectItem>
                  <SelectItem value="top-left">Top left</SelectItem>
                  <SelectItem value="bottom-right">Bottom right</SelectItem>
                  <SelectItem value="bottom-left">Bottom left</SelectItem>
                </SelectContent>
              </Select>
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
