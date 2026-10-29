"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { cn } from "@workspace/ui/lib/utils";
import { ImageOff } from "lucide-react";
import { getElementContext } from "../../_helpers/feedback-detail";
import { getSelectionFrame } from "../../_helpers/selection-frame";
import type { ListFeedbackOutput } from "../../_services/list-feedback";
import { getBoardStatusAppearance } from "../kanban/board-status-appearance";
import { ElementContextCard } from "./element-context-card.client";
import { FeedbackPropertiesRail } from "./feedback-properties-rail.client";
import { ScreenshotDialog } from "./screenshot-dialog.client";

type FeedbackItem = ListFeedbackOutput[number];

type FeedbackDetailPanelProps = {
  feedback: FeedbackItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  hasGitHubLink?: boolean;
  hasLinearLink?: boolean;
  hasJiraLink?: boolean;
};

export function FeedbackDetailPanel({
  feedback,
  open,
  onOpenChange,
  projectId,
  hasGitHubLink = false,
  hasLinearLink = false,
  hasJiraLink = false,
}: FeedbackDetailPanelProps) {
  if (!feedback) return null;

  const element = getElementContext(feedback);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 overflow-y-auto sm:max-w-3xl">
        <SheetTitle className="sr-only">Feedback detail</SheetTitle>
        <SheetDescription className="sr-only">
          View and manage feedback details
        </SheetDescription>

        <div
          className={cn(
            "h-1 w-full shrink-0",
            getBoardStatusAppearance(feedback.status).swatchClassName,
          )}
        />

        <div className="grid min-h-full md:grid-cols-[1fr_15rem]">
          <div className="flex min-w-0 flex-col gap-5 p-5 pr-12 md:pr-5">
            <p className="text-lg leading-snug font-semibold whitespace-pre-wrap">
              {feedback.comment}
            </p>

            {feedback.screenshotUrl ? (
              <ScreenshotDialog
                src={feedback.screenshotUrl}
                frame={getSelectionFrame(feedback.metadata)}
              />
            ) : (
              <div className="flex items-center justify-center gap-2 rounded-md border border-dashed py-6 text-xs text-muted-foreground">
                <ImageOff className="size-4 opacity-50" />
                No screenshot captured
              </div>
            )}

            {element.hasContext && <ElementContextCard element={element} />}
          </div>

          <FeedbackPropertiesRail
            feedback={feedback}
            projectId={projectId}
            hasGitHubLink={hasGitHubLink}
            hasLinearLink={hasLinearLink}
            hasJiraLink={hasJiraLink}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
