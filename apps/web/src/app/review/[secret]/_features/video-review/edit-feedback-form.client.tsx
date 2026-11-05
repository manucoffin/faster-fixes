"use client";

import {
  UpdateVideoFeedbackSchema,
  type UpdateVideoFeedbackInput,
} from "@/app/_domains/feedback/_services/create-video-feedback.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@workspace/ui/components/form";
import { Textarea } from "@workspace/ui/components/textarea";
import { useForm } from "react-hook-form";
import type { z } from "zod";

type EditFeedbackFormProps = {
  comment: string;
  isSaving: boolean;
  onSave: (input: UpdateVideoFeedbackInput) => void;
  onCancel: () => void;
};

export function EditFeedbackForm({
  comment,
  isSaving,
  onSave,
  onCancel,
}: EditFeedbackFormProps) {
  const form = useForm<
    z.input<typeof UpdateVideoFeedbackSchema>,
    unknown,
    UpdateVideoFeedbackInput
  >({
    resolver: zodResolver(UpdateVideoFeedbackSchema),
    defaultValues: { comment },
  });

  return (
    <Form {...form}>
      <form
        aria-label="Edit comment"
        className="space-y-2"
        onSubmit={form.handleSubmit(onSave)}
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel();
        }}
      >
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  rows={3}
                  maxLength={5000}
                  autoFocus
                  disabled={isSaving}
                  aria-label="Comment"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
