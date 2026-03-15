"use client";

import {
  CreateProjectInputs,
  CreateProjectSchema,
} from "@/app/(authenticated)/projets/_features/create/create-project.schema";
import { useActiveOrganization } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Check, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";

export function CreateProjectForm() {
  const trpc = useTRPC();
  const router = useRouter();
  const { data: activeOrg } = useActiveOrganization();

  const [rawApiKey, setRawApiKey] = React.useState<string | null>(null);
  const [projectId, setProjectId] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const createProject = useMutation(
    trpc.authenticated.projets.create.mutationOptions({
      onSuccess: (result) => {
        setRawApiKey(result.rawApiKey);
        setProjectId(result.id);
      },
      onError: (error) => {
        form.setError("root", {
          message: error.message || "Error creating project.",
        });
      },
    }),
  );

  const form = useForm<CreateProjectInputs>({
    resolver: zodResolver(CreateProjectSchema),
    defaultValues: {
      organizationId: "",
      name: "",
      url: "",
    },
    values: activeOrg
      ? { organizationId: activeOrg.id, name: "", url: "" }
      : undefined,
  });

  const onSubmit = (data: CreateProjectInputs) => {
    createProject.mutate(data);
  };

  const handleCopy = () => {
    if (!rawApiKey) return;
    navigator.clipboard.writeText(rawApiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDialogClose = () => {
    if (projectId) {
      router.push(`/projets/${projectId}`);
    }
  };

  return (
    <>
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
            {createProject.isPending
              ? "Creating..."
              : "Create project"}
          </Button>
        </form>
      </Form>

      <Dialog open={!!rawApiKey} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Project created!</DialogTitle>
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
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <Button onClick={handleDialogClose} className="w-full">
            I&apos;ve copied my API key
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
