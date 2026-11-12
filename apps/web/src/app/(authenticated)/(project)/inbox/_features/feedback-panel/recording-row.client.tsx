"use client";

import { formatTimecode } from "@/app/_domains/video/_helpers/format-timecode";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { PlayCircle } from "lucide-react";
import { formatRecordingSummary } from "../../_helpers/recording-summary";

type RecordingRowProps = {
  feedbackId: string;
  durationMs: number;
  onPlay: () => void;
};

export function RecordingRow({
  feedbackId,
  durationMs,
  onPlay,
}: RecordingRowProps) {
  const trpc = useTRPC();
  // The duration is on the list item; the counts need the Diagnostic Trail,
  // which the list never loads, so they arrive after the row.
  const countsQuery = useQuery(
    trpc.authenticated.projects.feedback.countDiagnostics.queryOptions({
      feedbackId,
    }),
  );
  const summary = countsQuery.data
    ? formatRecordingSummary(countsQuery.data)
    : null;

  return (
    <button
      type="button"
      onClick={onPlay}
      className="flex items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50"
    >
      <PlayCircle className="size-4 shrink-0 text-muted-foreground" />
      <span className="font-medium">Play recording</span>
      <span className="font-mono text-xs text-muted-foreground tabular-nums">
        {formatTimecode(durationMs)}
      </span>
      {summary && (
        <span className="ml-auto truncate text-xs text-destructive">
          {summary}
        </span>
      )}
    </button>
  );
}
