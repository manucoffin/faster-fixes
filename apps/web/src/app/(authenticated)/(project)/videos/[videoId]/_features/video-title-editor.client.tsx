"use client";

import { UpdateVideoTitleSchema } from "@/app/_domains/video/_services/update-video-title.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

const TitleSchema = UpdateVideoTitleSchema.pick({ title: true });

type TitleInput = z.infer<typeof TitleSchema>;

type VideoTitleEditorProps = {
  title: string;
  isSaving: boolean;
  onRename: (title: string) => Promise<unknown>;
};

export function VideoTitleEditor({
  title,
  isSaving,
  onRename,
}: VideoTitleEditorProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (!isEditing) {
    return (
      <h1 className="min-w-0">
        <button
          type="button"
          title="Rename"
          className="-mx-1 max-w-full cursor-text truncate rounded-sm px-1 text-left text-xl font-semibold transition-colors hover:bg-muted"
          onClick={() => setIsEditing(true)}
        >
          {title}
        </button>
      </h1>
    );
  }

  return (
    <TitleForm
      title={title}
      isSaving={isSaving}
      onRename={onRename}
      onDone={() => setIsEditing(false)}
    />
  );
}

type TitleFormProps = VideoTitleEditorProps & {
  onDone: () => void;
};

function TitleForm({ title, isSaving, onRename, onDone }: TitleFormProps) {
  const form = useForm<TitleInput>({
    resolver: zodResolver(TitleSchema),
    defaultValues: { title },
  });

  const handleSubmit = async ({ title: nextTitle }: TitleInput) => {
    if (nextTitle === title) {
      onDone();
      return;
    }
    try {
      await onRename(nextTitle);
      onDone();
    } catch (error) {
      // The editor stays open so the User can fix what the server refused.
      form.setError("title", { message: getErrorMessage(error) });
    }
  };

  return (
    <Form {...form}>
      <form
        aria-label="Rename video"
        className="min-w-0 flex-1"
        onSubmit={form.handleSubmit(handleSubmit)}
        onKeyDown={(event) => {
          if (event.key === "Escape") onDone();
        }}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  autoFocus
                  aria-label="Title"
                  maxLength={200}
                  disabled={isSaving}
                  className="h-9 max-w-xl text-xl font-semibold md:text-xl"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
