"use client";

import { UpdateVideoTitleSchema } from "@/app/_domains/video/_services/update-video-title.schema";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
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
import { useForm } from "react-hook-form";
import type { z } from "zod";

const TitleSchema = UpdateVideoTitleSchema.pick({ title: true });

type TitleInput = z.infer<typeof TitleSchema>;

type RenameVideoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  isSaving: boolean;
  onRename: (title: string) => Promise<unknown>;
};

export function RenameVideoDialog({
  open,
  onOpenChange,
  title,
  isSaving,
  onRename,
}: RenameVideoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename video</DialogTitle>
        </DialogHeader>
        {/* Mounted per opening, so the field starts from the current title. */}
        {open && (
          <RenameVideoForm
            title={title}
            isSaving={isSaving}
            onRename={onRename}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type RenameVideoFormProps = {
  title: string;
  isSaving: boolean;
  onRename: (title: string) => Promise<unknown>;
  onDone: () => void;
};

function RenameVideoForm({
  title,
  isSaving,
  onRename,
  onDone,
}: RenameVideoFormProps) {
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
      form.setError("title", { message: getErrorMessage(error) });
    }
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input autoFocus disabled={isSaving} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={onDone}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Rename"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
