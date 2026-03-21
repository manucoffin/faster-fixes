"use client";

import {
  CreateReviewerInputs,
  CreateReviewerSchema,
} from "@/app/(authenticated)/(project)/reviewers/_features/create/create-reviewer.schema";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Plus } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";

type CreateReviewerDialogProps = {
  projectId: string;
  onCreated: (shareUrl: string) => void;
};

export function CreateReviewerDialog({
  projectId,
  onCreated,
}: CreateReviewerDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const form = useForm<CreateReviewerInputs>({
    resolver: zodResolver(CreateReviewerSchema),
    defaultValues: { projectId, name: "" },
  });

  const createReviewer = useMutation(
    trpc.authenticated.projets.reviewer.create.mutationOptions({
      onSuccess: (result) => {
        queryClient.invalidateQueries(
          trpc.authenticated.projets.reviewer.list.queryOptions({ projectId }),
        );
        onCreated(result.shareUrl);
        setOpen(false);
        form.reset();
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
    }),
  );

  const onSubmit = (data: CreateReviewerInputs) => {
    createReviewer.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Add reviewer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New reviewer</DialogTitle>
          <DialogDescription>
            Enter your client&apos;s name. A unique share link will be
            generated.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
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
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Marie - CEO"
                      disabled={createReviewer.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={createReviewer.isPending}
              className="self-end"
            >
              {createReviewer.isPending ? "Creating..." : "Create"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
