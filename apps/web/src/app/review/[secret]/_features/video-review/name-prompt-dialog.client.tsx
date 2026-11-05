"use client";

import {
  ClaimVideoReviewerSchema,
  type ClaimVideoReviewerInput,
} from "@/app/api/v1/review/_services/claim-video-reviewer.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { generateReviewerName } from "../../_helpers/generate-reviewer-name";
import {
  generateReviewerSecret,
  writeReviewerIdentity,
  type ReviewerIdentity,
} from "../../_helpers/reviewer-identity";
import { ReviewRequestError, sendReviewRequest } from "./send-review-request";

type NamePromptDialogProps = {
  open: boolean;
  secret: string;
  videoId: string;
  onClaimed: (identity: ReviewerIdentity) => void;
  onCancel: () => void;
};

// Asked once, at the first Post: the generated name is prefilled so keeping
// it is one click.
export function NamePromptDialog({
  open,
  secret,
  videoId,
  onClaimed,
  onCancel,
}: NamePromptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        {open ? (
          <NamePromptForm
            secret={secret}
            videoId={videoId}
            onClaimed={onClaimed}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type NamePromptFormProps = Omit<NamePromptDialogProps, "open" | "onCancel">;

function NamePromptForm({ secret, videoId, onClaimed }: NamePromptFormProps) {
  const [suggestion] = useState(() => generateReviewerName());
  const form = useForm<
    z.input<typeof ClaimVideoReviewerSchema>,
    unknown,
    ClaimVideoReviewerInput
  >({
    resolver: zodResolver(ClaimVideoReviewerSchema),
    defaultValues: { name: suggestion },
  });

  const claimReviewer = useMutation({
    mutationFn: async ({ name }: ClaimVideoReviewerInput) => {
      const reviewerSecret = generateReviewerSecret();
      const { reviewer } = await sendReviewRequest<{
        reviewer: { id: string; name: string };
      }>(secret, "/reviewers", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-reviewer-token": reviewerSecret,
        },
        body: JSON.stringify({ name }),
      });
      return {
        name: reviewer.name,
        secret: reviewerSecret,
        reviewerId: reviewer.id,
      };
    },
    onSuccess: (identity) => {
      writeReviewerIdentity(window.localStorage, videoId, identity);
      onClaimed(identity);
    },
    onError: (error) => {
      // A taken name belongs under the field; anything else above it.
      if (error instanceof ReviewRequestError && error.code === "name_taken") {
        form.setError("name", { message: error.message });
      } else {
        form.setError("root", { message: error.message });
      }
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => claimReviewer.mutate(data))}
        className="space-y-4"
      >
        <DialogHeader>
          <DialogTitle>Choose a name</DialogTitle>
          <DialogDescription>
            Your comments on this video carry this name. Keep the suggested one
            or type your own.
          </DialogDescription>
        </DialogHeader>
        {form.formState.errors.root ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        ) : null}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  autoFocus
                  maxLength={50}
                  disabled={claimReviewer.isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={claimReviewer.isPending}>
            {claimReviewer.isPending ? "Posting..." : "Post comment"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
