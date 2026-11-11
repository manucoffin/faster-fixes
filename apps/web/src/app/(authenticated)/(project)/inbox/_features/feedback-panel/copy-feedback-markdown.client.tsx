"use client";

import { formatFeedbackListItemAsMarkdown } from "@/app/_domains/feedback/_helpers/format-feedback-markdown";
import { readFeedbackSelection } from "@/app/_domains/feedback/_helpers/read-feedback-selection";
import { CopyButton } from "@workspace/ui/components/copy-button";
import { useMemo } from "react";
import type { ListFeedbackOutput } from "../../_services/list-feedback";

type FeedbackItem = ListFeedbackOutput[number];

type CopyFeedbackMarkdownProps = {
  feedback: FeedbackItem;
};

export function CopyFeedbackMarkdown({ feedback }: CopyFeedbackMarkdownProps) {
  const markdown = useMemo(
    () =>
      formatFeedbackListItemAsMarkdown({
        ...feedback,
        selection: readFeedbackSelection(feedback),
      }),
    [feedback],
  );

  return (
    <CopyButton content={markdown} variant="outline" size="sm">
      Copy markdown
    </CopyButton>
  );
}
