"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

type CopyFeedbackMarkdownProps = {
  projectId: string;
  feedbackId: string;
};

export function CopyFeedbackMarkdown({
  projectId,
  feedbackId,
}: CopyFeedbackMarkdownProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const copyMutation = useMutation({
    mutationFn: async () => {
      // Always the current document: the steps may have been derived since.
      const markdown = queryClient.fetchQuery({
        ...trpc.authenticated.projects.feedback.getMarkdown.queryOptions({
          projectId,
          feedbackId,
        }),
        staleTime: 0,
      });
      const [fetched, copied] = await Promise.allSettled([
        markdown,
        writeToClipboard(markdown),
      ]);
      if (fetched.status === "rejected") {
        throw new Error(getErrorMessage(fetched.reason));
      }
      if (copied.status === "rejected") {
        throw new Error("Could not copy the markdown to the clipboard.");
      }
    },
    onSuccess: () => toast.success("Markdown copied."),
    onError: (error) => toast.error(error.message),
  });

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={copyMutation.isPending}
      onClick={() => copyMutation.mutate()}
    >
      <Copy className="size-3.5" />
      Copy markdown
    </Button>
  );
}

/**
 * Hands the clipboard a pending value so Safari keeps the click's user
 * activation while the document is fetched; `writeText` after an `await`
 * would be refused there.
 */
async function writeToClipboard(text: Promise<string>) {
  if (typeof ClipboardItem === "undefined") {
    await navigator.clipboard.writeText(await text);
    return;
  }
  await navigator.clipboard.write([
    new ClipboardItem({
      "text/plain": text.then(
        (value) => new Blob([value], { type: "text/plain" }),
      ),
    }),
  ]);
}
