"use client";

import { SelectionMarker } from "@/app/_domains/video/_components/selection-marker";
import { formatFeedbackTime } from "@/app/_domains/video/_helpers/format-timecode";
import { mapSelectionToBox } from "@/app/_domains/video/_helpers/map-selection-to-box";
import { readVideoSelection } from "@/app/_domains/video/_helpers/read-video-selection";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { cn } from "@workspace/ui/lib/utils";
import { ImageOff } from "lucide-react";
import {
  getElementContext,
  getFeedbackDetailSections,
} from "../../_helpers/feedback-detail";
import { getSelectionFrame } from "../../_helpers/selection-frame";
import type { ListFeedbackOutput } from "../../_services/list-feedback";
import { getFeedbackStatusAppearance } from "@/app/_domains/feedback/_components/feedback-status-appearance";
import { ElementContextCard } from "./element-context-card.client";
import { FeedbackPropertiesRail } from "./feedback-properties-rail.client";
import { ScreenshotDialog } from "./screenshot-dialog.client";
import { SelectionFrameOverlay } from "./selection-frame-overlay";

type FeedbackItem = ListFeedbackOutput[number];

// The captured frame is shown at its own aspect ratio, so the image box is the
// frame and the normalized Selection maps onto it as is.
const UNIT_BOX = { width: 1, height: 1 };

// Null when the Feedback marks nothing, so the switch is not offered.
function renderScreenshotOverlay(feedback: FeedbackItem) {
  if (feedback.videoId === null) {
    const frame = getSelectionFrame(feedback.metadata);
    return frame ? <SelectionFrameOverlay frame={frame} /> : null;
  }

  const geometry = mapSelectionToBox(
    readVideoSelection(feedback),
    UNIT_BOX,
    UNIT_BOX,
  );
  return geometry ? (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <SelectionMarker geometry={geometry} />
    </div>
  ) : null;
}

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
  const sections = getFeedbackDetailSections(feedback);
  const overlay = renderScreenshotOverlay(feedback);

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
            getFeedbackStatusAppearance(feedback.status).swatchClassName,
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
                overlay={overlay}
                badge={
                  feedback.videoId !== null && feedback.startMs !== null ? (
                    <span className="absolute top-2 left-2 rounded border bg-background/90 px-1.5 py-0.5 font-mono text-xs text-foreground tabular-nums">
                      {formatFeedbackTime(feedback.startMs, feedback.endMs)}
                    </span>
                  ) : undefined
                }
              />
            ) : (
              <div className="flex items-center justify-center gap-2 rounded-md border border-dashed py-6 text-xs text-muted-foreground">
                <ImageOff className="size-4 opacity-50" />
                No screenshot captured
              </div>
            )}

            {sections.elementContext && element.hasContext && (
              <ElementContextCard element={element} />
            )}
          </div>

          <FeedbackPropertiesRail
            feedback={feedback}
            sections={sections}
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
