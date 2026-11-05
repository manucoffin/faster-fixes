"use client";

import { Button } from "@workspace/ui/components/button";
import { Download, ExternalLink, SquareKanban } from "lucide-react";
import Link from "next/link";

import { serializeBoardSource } from "@/app/(authenticated)/(project)/inbox/_helpers/board-source";
import type { GetVideoOutput } from "../_services/get-video";
import { useExportVideoFeedback } from "./use-export-video-feedback";
import { useVideoActions } from "./use-video-actions";
import { VideoSharePopover } from "./video-share-popover.client";
import { VideoTitleEditor } from "./video-title-editor.client";

type VideoPageHeaderProps = {
  video: GetVideoOutput;
};

export function VideoPageHeader({ video }: VideoPageHeaderProps) {
  const {
    renameMutation,
    replaceShareLinkMutation,
    setAnnotationsOpenMutation,
  } = useVideoActions({ videoId: video.id, projectId: video.projectId });
  const exportFeedbackMutation = useExportVideoFeedback({
    videoId: video.id,
    title: video.title,
  });

  // The review page opens a `ready` Video only.
  const reviewUrl = video.state === "ready" ? video.shareUrl : null;

  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <VideoTitleEditor
        title={video.title}
        isSaving={renameMutation.isPending}
        onRename={(title) =>
          renameMutation.mutateAsync({ videoId: video.id, title })
        }
      />
      <div className="flex items-center gap-2">
        <VideoSharePopover
          shareUrl={video.shareUrl}
          annotationsOpen={video.annotationsOpen}
          isReplacing={replaceShareLinkMutation.isPending}
          isUpdatingAnnotations={setAnnotationsOpenMutation.isPending}
          onReplaceLink={() =>
            replaceShareLinkMutation.mutateAsync({ videoId: video.id })
          }
          onAnnotationsOpenChange={(open) =>
            setAnnotationsOpenMutation.mutate({ videoId: video.id, open })
          }
        />
        {reviewUrl ? (
          <Button variant="outline" size="sm" asChild>
            <a href={reviewUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink />
              Open review page
            </a>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ExternalLink />
            Open review page
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={exportFeedbackMutation.isPending}
          onClick={() => exportFeedbackMutation.mutate()}
        >
          <Download />
          Export feedback
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link
            href={`/inbox?source=${encodeURIComponent(
              serializeBoardSource({ kind: "video", videoId: video.id }),
            )}`}
          >
            <SquareKanban />
            View on Task board
          </Link>
        </Button>
      </div>
    </header>
  );
}
