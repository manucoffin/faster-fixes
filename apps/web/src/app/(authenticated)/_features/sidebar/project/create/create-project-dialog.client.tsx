"use client";

import { useActiveProject } from "@/app/_features/project/active-project-provider.client";
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
  CreateProjectInputs,
  CreateProjectSchema,
} from "./create-project.schema";

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
  const [rawApiKey, setRawApiKey] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const form = useForm<CreateProjectInputs>({
    resolver: zodResolver(CreateProjectSchema),
    defaultValues: {
      organizationId: activeOrg?.id ?? "",
      name: "",
      url: "",
    },
  });

  const createProject = useMutation(
    trpc.authenticated.projects.create.mutationOptions({
      onSuccess: async (result) => {
        setOpen(false);
        setRawApiKey(result.rawApiKey);
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

  const onSubmit = (data: CreateProjectInputs) => {
    createProject.mutate(data);
  };

  const handleCopy = () => {
    if (!rawApiKey) return;
    navigator.clipboard.writeText(rawApiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApiKeyDialogClose = () => {
    setRawApiKey(null);
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
                <p className="text-destructive text-sm">
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
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://client.com"
                        type="url"
                        disabled={createProject.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The main URL of your client&apos;s site.
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

      <Dialog open={!!rawApiKey} onOpenChange={handleApiKeyDialogClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Project created</DialogTitle>
            <DialogDescription>
              Here is your API key. It will only be shown once. Copy it now and
              store it in a safe place.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted flex items-center gap-2 rounded-md border p-3">
            <code className="flex-1 font-mono text-sm break-all">
              {rawApiKey}
            </code>
            <Button variant="ghost" size="icon" onClick={handleCopy}>
              {copied ? (
                <Check className="text-success size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>

          <Button onClick={handleApiKeyDialogClose} className="w-full">
            I&apos;ve copied my API key
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
