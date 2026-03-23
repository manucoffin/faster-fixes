"use client";

import { formatFeedbackAsMarkdown } from "@/app/_features/feedback/format-feedback-markdown";
import { CopyButton } from "@workspace/ui/components/copy-button";
import { useMemo } from "react";
import type { GetFeedbackOutput } from "../get-feedback.trpc.query";

type FeedbackItem = GetFeedbackOutput[number];

type CopyFeedbackMarkdownProps = {
  feedback: FeedbackItem;
};

export function CopyFeedbackMarkdown({ feedback }: CopyFeedbackMarkdownProps) {
  const markdown = useMemo(
    () => formatFeedbackAsMarkdown(feedback),
    [feedback],
  );

  return (
    <CopyButton content={markdown} variant="outline" size="sm">
      Copy markdown
    </CopyButton>
  );
}
