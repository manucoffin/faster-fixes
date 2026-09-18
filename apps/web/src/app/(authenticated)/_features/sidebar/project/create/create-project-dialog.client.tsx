"use client";

import { useActiveProject } from "@/app/_domains/project/active-project/active-project-provider.client";
import { useActiveOrganization } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
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
import { Check, Copy, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import {
  CreateProjectInput,
  CreateProjectSchema,
} from "@/app/(authenticated)/_services/create-project.schema";

type CreateProjectDialogProps = {
  children?: React.ReactNode;
};

export function CreateProjectDialog({ children }: CreateProjectDialogProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: activeOrg } = useActiveOrganization();
  const { setActiveProject } = useActiveProject();

  const [open, setOpen] = React.useState(false);
  const [createdProjectId, setCreatedProjectId] = React.useState<string | null>(
    null,
  );
  const [copied, setCopied] = React.useState(false);

  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(CreateProjectSchema),
    defaultValues: {
      organizationId: activeOrg?.id ?? "",
      name: "",
      domain: "",
    },
  });

  const createProject = useMutation(
    trpc.authenticated.createProject.mutationOptions({
      onSuccess: async (result) => {
        setOpen(false);
        setCreatedProjectId(result.publicId);
        await queryClient.invalidateQueries({
          queryKey: trpc.authenticated.projects.list.queryKey(),
        });
        setActiveProject(result.id);
      },
      onError: (error) => {
        form.setError("root", {
          message: error.message || "Error creating project.",
        });
      },
    }),
  );

  const onSubmit = (data: CreateProjectInput) => {
    createProject.mutate(data);
  };

  const handleCopy = () => {
    if (!createdProjectId) return;
    navigator.clipboard.writeText(createdProjectId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreatedDialogClose = () => {
    setCreatedProjectId(null);
    router.push("/inbox");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset();
      createProject.reset();
    }
  };

  // Keep organizationId in sync when activeOrg changes
  React.useEffect(() => {
    if (activeOrg?.id) {
      form.setValue("organizationId", activeOrg.id);
    }
  }, [activeOrg?.id, form]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {children ?? (
            <Button size="sm" className="w-full">
              <Plus className="size-4" />
              New project
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>
              A project corresponds to a client site where you want to collect
              feedback.
            </DialogDescription>
          </DialogHeader>

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
                      <Input
                        placeholder="Client Site XYZ"
                        disabled={createProject.isPending}
                        {...field}
                      />
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
                    <FormLabel>Project domain</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="client.com"
                        disabled={createProject.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The domain of your client&apos;s site. Subdomains, www.,
                      and protocol variants are matched automatically. Localhost
                      is always allowed for local development.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={createProject.isPending}
                className="self-end"
              >
                {createProject.isPending ? "Creating..." : "Create project"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!createdProjectId} onOpenChange={handleCreatedDialogClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Project created</DialogTitle>
            <DialogDescription>
              Use this Project ID to install the widget. You can find it anytime
              in project settings.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
            <code className="flex-1 font-mono text-sm break-all">
              {createdProjectId}
            </code>
            <Button variant="ghost" size="icon" onClick={handleCopy}>
              {copied ? (
                <Check className="size-4 text-success" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>

          <Button onClick={handleCreatedDialogClose} className="w-full">
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
