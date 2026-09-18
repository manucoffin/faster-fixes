"use client";

import { formatFeedbackAsMarkdown } from "@/app/_domains/feedback/_helpers/format-feedback-markdown";
import { CopyButton } from "@workspace/ui/components/copy-button";
import { useMemo } from "react";
import type { ListFeedbackOutput } from "../../_services/list-feedback";

type FeedbackItem = ListFeedbackOutput[number];

type CopySelectedMarkdownProps = {
  items: FeedbackItem[];
};

export function CopySelectedMarkdown({ items }: CopySelectedMarkdownProps) {
  const markdown = useMemo(
    () => items.map(formatFeedbackAsMarkdown).join("\n\n---\n\n"),
    [items],
  );

  return (
    <CopyButton
      content={markdown}
      variant="outline"
      size="sm"
      className="h-7 text-xs"
    >
      Copy markdown
    </CopyButton>
  );
}
