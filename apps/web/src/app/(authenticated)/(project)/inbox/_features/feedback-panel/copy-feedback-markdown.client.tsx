"use client";

import { CopyButton } from "@workspace/ui/components/copy-button";
import { useMemo } from "react";
import { formatFeedbackAsMarkdown } from "../../../_utils/format-feedback-markdown";
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
