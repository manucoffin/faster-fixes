"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Textarea } from "@workspace/ui/components/textarea";
import { MessageSquareIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { SendFeedbackInputs, SendFeedbackSchema } from "./send-feedback.schema";

export function FeedbackButton() {
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);

  const form = useForm<SendFeedbackInputs>({
    resolver: zodResolver(SendFeedbackSchema),
    defaultValues: { message: "" },
  });

  const sendFeedbackMutation = useMutation(trpc.authenticated.feedback.send.mutationOptions({
    onSuccess: () => {
      toast.success("Merci pour votre feedback !");
      form.reset();
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Une erreur s'est produite.");
    },
  }));

  const onSubmit = (data: SendFeedbackInputs) => {
    sendFeedbackMutation.mutate(data);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquareIcon className="size-3.5" />
          Feedback
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
        >
          <p className="text-sm font-medium">Envoyer un feedback</p>
          <Textarea
            placeholder="Votre feedback..."
            rows={4}
            {...form.register("message")}
          />
          {form.formState.errors.message && (
            <p className="text-destructive text-xs">
              {form.formState.errors.message.message}
            </p>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={sendFeedbackMutation.isPending}
            className="self-end"
          >
            {sendFeedbackMutation.isPending ? "Envoi..." : "Envoyer"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
