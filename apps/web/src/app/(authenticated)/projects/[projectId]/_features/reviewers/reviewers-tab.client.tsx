"use client";

import {
  CreateReviewerInputs,
  CreateReviewerSchema,
} from "@/app/(authenticated)/projects/_features/reviewers/create-reviewer.schema";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@workspace/ui/components/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Check, Copy, Plus, UserX } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type ReviewersTabProps = {
  projectId: string;
};

export function ReviewersTab({ projectId }: ReviewersTabProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [newShareUrl, setNewShareUrl] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState<string | null>(null);

  const reviewersQuery = useQuery(
    trpc.authenticated.projets.reviewer.list.queryOptions({ projectId }),
  );

  const createReviewer = useMutation(
    trpc.authenticated.projets.reviewer.create.mutationOptions({
      onSuccess: (result) => {
        queryClient.invalidateQueries(
          trpc.authenticated.projets.reviewer.list.queryOptions({ projectId }),
        );
        setNewShareUrl(result.shareUrl);
        setCreateOpen(false);
        form.reset();
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
    }),
  );

  const revokeReviewer = useMutation(
    trpc.authenticated.projets.reviewer.revoke.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.authenticated.projets.reviewer.list.queryOptions({ projectId }),
        );
        toast.success("Reviewer revoked");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const form = useForm<CreateReviewerInputs>({
    resolver: zodResolver(CreateReviewerSchema),
    defaultValues: { projectId, name: "" },
  });

  const onSubmit = (data: CreateReviewerInputs) => {
    createReviewer.mutate(data);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex flex-col gap-8">
      {newShareUrl && (
        <div className="border-success bg-success/10 rounded-md border p-4">
          <p className="text-success mb-2 text-sm font-medium">
            Reviewer created! Share this link with your client:
          </p>
          <div className="flex items-center gap-2">
            <code className="bg-background flex-1 rounded px-2 py-1 font-mono text-xs break-all">
              {newShareUrl}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(newShareUrl, "new")}
            >
              {copied === "new" ? (
                <Check className="text-success h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
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
      </div>

      {matchQueryStatus(reviewersQuery, {
        Loading: <p className="text-muted-foreground text-sm">Loading...</p>,
        Errored: (
          <p className="text-destructive text-sm">Error loading reviewers.</p>
        ),
        Empty: (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No reviewers. Add your first client.
          </p>
        ),
        Success: ({ data: reviewers }) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead>Share link</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviewers.map((reviewer) => (
                <TableRow key={reviewer.id}>
                  <TableCell className="font-medium">{reviewer.name}</TableCell>
                  <TableCell>
                    {reviewer.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Revoked</Badge>
                    )}
                  </TableCell>
                  <TableCell>{reviewer.feedbackCount}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(reviewer.shareUrl, reviewer.id)}
                    >
                      {copied === reviewer.id ? (
                        <Check className="text-success mr-1 h-3 w-3" />
                      ) : (
                        <Copy className="mr-1 h-3 w-3" />
                      )}
                      Copy link
                    </Button>
                  </TableCell>
                  <TableCell>
                    {reviewer.isActive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        disabled={revokeReviewer.isPending}
                        onClick={() =>
                          revokeReviewer.mutate({ reviewerId: reviewer.id })
                        }
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ),
      })}
    </div>
  );
}
