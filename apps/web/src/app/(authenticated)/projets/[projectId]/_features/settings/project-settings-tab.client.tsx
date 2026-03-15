"use client";

import { DashboardSection } from "@/app/(authenticated)/_features/dashboard/dashboard-section";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
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
import { Check, Copy, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  UpdateProjectInputs,
  UpdateProjectSchema,
} from "@/app/(authenticated)/projets/_features/settings/update-project.schema";

type ProjectSettingsTabProps = {
  projectId: string;
};

export function ProjectSettingsTab({ projectId }: ProjectSettingsTabProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [newApiKey, setNewApiKey] = React.useState<string | null>(null);
  const [keyCopied, setKeyCopied] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [regenOpen, setRegenOpen] = React.useState(false);

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

  const regenerateApiKey = useMutation(
    trpc.authenticated.projets.regenerateApiKey.mutationOptions({
      onSuccess: (result) => {
        setNewApiKey(result.rawApiKey);
        setRegenOpen(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const deleteProject = useMutation(
    trpc.authenticated.projets.delete.mutationOptions({
      onSuccess: () => {
        router.push("/projets");
        toast.success("Project deleted");
      },
      onError: (error) => {
        toast.error(error.message);
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
            (project.widgetConfig?.position as "bottom-right" | "bottom-left") ??
            "bottom-right",
        }
      : undefined,
  });

  const onSubmit = (data: UpdateProjectInputs) => {
    updateProject.mutate(data);
  };

  const handleCopyKey = () => {
    if (!newApiKey) return;
    navigator.clipboard.writeText(newApiKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-12">
      <DashboardSection
        title="Project information"
        description="Edit the name, URL, and widget configuration."
        cardTitle="General settings"
        cardClassName="lg:max-w-lg"
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            {form.formState.errors.root && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
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
                      <SelectItem value="bottom-right">
                        Bottom right
                      </SelectItem>
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
      </DashboardSection>

      <DashboardSection
        title="API Key"
        description="Used by the widget to submit feedback. Only the last 4 characters are shown."
        cardTitle="API Key"
        cardClassName="lg:max-w-lg"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
            <code className="flex-1 font-mono text-sm">
              ff_••••••••••••••••••••••••••••••{project?.apiKeyLastFour}
            </code>
          </div>

          {newApiKey && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <p className="mb-2 text-xs font-medium text-destructive">
                New key — copy it now, it won&apos;t be shown again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all font-mono text-sm">
                  {newApiKey}
                </code>
                <Button variant="ghost" size="icon" onClick={handleCopyKey}>
                  {keyCopied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          <Dialog open={regenOpen} onOpenChange={setRegenOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="self-start">
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate API key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Regenerate API key?</DialogTitle>
                <DialogDescription>
                  The old key will be immediately invalidated. The widget will
                  no longer be able to submit feedback until the new key is
                  configured.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setRegenOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={regenerateApiKey.isPending}
                  onClick={() => regenerateApiKey.mutate({ projectId })}
                >
                  {regenerateApiKey.isPending
                    ? "Regenerating..."
                    : "Regenerate"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Danger zone"
        description="Deletion is permanent and irreversible."
        cardTitle="Delete project"
        cardClassName="lg:max-w-lg"
      >
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete project?</DialogTitle>
              <DialogDescription>
                This action is irreversible. All reviewers, feedback, and
                associated files will be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteProject.isPending}
                onClick={() => deleteProject.mutate({ projectId })}
              >
                {deleteProject.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardSection>
    </div>
  );
}
