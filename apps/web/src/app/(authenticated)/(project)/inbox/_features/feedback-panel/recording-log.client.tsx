"use client";

import {
  formatTimelineOffset,
  formatTimelineStep,
} from "@/app/_domains/feedback/_helpers/format-timeline-lines";
import type { RecordingTimelineEntry } from "@/app/_domains/feedback/_helpers/merge-recording-timeline";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import { useEffect, useRef, useState } from "react";
import {
  filterRecordingLog,
  findCurrentLogEntry,
  RECORDING_LOG_SOURCES,
  type RecordingLogClock,
  type RecordingLogSource,
  recordingLogTime,
} from "../../_helpers/recording-log";

const SOURCE_LABEL: Record<RecordingLogSource, string> = {
  step: "Steps",
  console: "Console",
  network: "Network",
};

// How long a scroll by the Member keeps the log from following playback.
const USER_SCROLL_HOLD_MS = 1500;

type RecordingLogProps = {
  feedbackId: string;
  time: number;
  /** Whether the player can seek: false while loading and when unplayable. */
  isLoaded: boolean;
  onSeek: (time: number) => void;
};

// Steps, console and network entries in time order, beside the player.
export function RecordingLog({
  feedbackId,
  time,
  isLoaded,
  onSeek,
}: RecordingLogProps) {
  const trpc = useTRPC();
  const [hidden, setHidden] = useState<ReadonlySet<RecordingLogSource>>(
    () => new Set(),
  );
  const playbackQuery = useQuery(
    trpc.authenticated.projects.feedback.getRecordingPlayback.queryOptions({
      feedbackId,
    }),
  );

  const toggleSource = (source: RecordingLogSource) =>
    setHidden((current) => {
      const next = new Set(current);
      if (!next.delete(source)) next.add(source);
      return next;
    });

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l">
      <div
        role="group"
        aria-label="Log sources"
        className="flex shrink-0 gap-1 border-b p-2"
      >
        {RECORDING_LOG_SOURCES.map((source) => (
          <Button
            key={source}
            variant={hidden.has(source) ? "ghost" : "secondary"}
            size="sm"
            aria-pressed={!hidden.has(source)}
            className={cn("h-7 px-2 text-xs", {
              "text-muted-foreground": hidden.has(source),
            })}
            onClick={() => toggleSource(source)}
          >
            {SOURCE_LABEL[source]}
          </Button>
        ))}
      </div>
      {matchQueryStatus(playbackQuery, {
        Loading: (
          <div className="flex flex-col gap-2 p-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ),
        Errored: (error) => (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Failed to load the log</EmptyTitle>
              <EmptyDescription>{getErrorMessage(error)}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ),
        Empty: (
          <Empty>
            <EmptyHeader>
              <EmptyDescription>Nothing was logged.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ),
        dataKey: "entries",
        Success: ({ data }) => (
          <RecordingLogEntries
            entries={filterRecordingLog(data.entries, hidden)}
            // An unreadable file has no clock to place the entries on.
            clock={
              isLoaded && data.startedAt !== null
                ? { startedAt: data.startedAt, durationMs: data.durationMs }
                : null
            }
            time={time}
            onSeek={onSeek}
          />
        ),
      })}
    </aside>
  );
}

type RecordingLogEntriesProps = {
  entries: RecordingTimelineEntry[];
  clock: RecordingLogClock | null;
  time: number;
  onSeek: (time: number) => void;
};

function RecordingLogEntries({
  entries,
  clock,
  time,
  onSeek,
}: RecordingLogEntriesProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const userScrollUntil = useRef(0);
  const current = findCurrentLogEntry(entries, clock, time);

  useEffect(() => {
    if (current === -1 || Date.now() < userScrollUntil.current) return;
    listRef.current
      ?.querySelector('[data-current="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [current]);

  const holdFollowing = () => {
    userScrollUntil.current = Date.now() + USER_SCROLL_HOLD_MS;
  };

  return (
    <ul
      ref={listRef}
      aria-label="Log"
      className="min-h-0 flex-1 overflow-y-auto py-1"
      onWheel={holdFollowing}
      onTouchMove={holdFollowing}
      // A press on the scrollbar, not on an entry.
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) holdFollowing();
      }}
      onScroll={() => {
        // Keeps holding while a scroll by the Member carries on.
        if (Date.now() < userScrollUntil.current) holdFollowing();
      }}
    >
      {entries.map((entry, index) => (
        <li
          key={`${entry.kind}-${entry.timestamp}-${index}`}
          data-current={index === current}
        >
          <button
            type="button"
            disabled={!clock}
            onClick={() => clock && onSeek(recordingLogTime(entry, clock))}
            className={cn(
              "flex w-full items-start gap-2 border-l-2 border-transparent px-3 py-1.5 text-left text-xs",
              clock && "cursor-pointer hover:bg-muted/60",
              index === current && "border-primary bg-muted",
              clock && index > current && "opacity-50",
            )}
          >
            <span className="w-12 shrink-0 text-right font-mono text-muted-foreground tabular-nums">
              {formatTimelineOffset(entry.offsetMs)}
            </span>
            <RecordingLogEntryContent entry={entry} />
          </button>
        </li>
      ))}
    </ul>
  );
}

type RecordingLogEntryContentProps = {
  entry: RecordingTimelineEntry;
};

// Console and network entries read as in the "View diagnostics" dialog.
function RecordingLogEntryContent({ entry }: RecordingLogEntryContentProps) {
  if (entry.kind === "step") {
    return (
      <span className="min-w-0 flex-1 break-words">
        {formatTimelineStep(entry.step)}
      </span>
    );
  }

  if (entry.kind === "console") {
    const { level, message } = entry.entry;
    const isError = level === "error" || level === "warn";
    return (
      <span className="flex min-w-0 flex-1 gap-2 font-mono">
        <span
          className={cn(
            "shrink-0 uppercase",
            isError ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {level}
        </span>
        <span className="min-w-0 break-all whitespace-pre-wrap">{message}</span>
      </span>
    );
  }

  const { method, url, status, duration } = entry.entry;
  const failed = status === 0 || status >= 400;
  return (
    <span className="flex min-w-0 flex-1 gap-2 font-mono">
      <span className="shrink-0 text-muted-foreground">{method}</span>
      <span className="min-w-0 flex-1 truncate" title={url}>
        {url}
      </span>
      <span
        className={cn(
          "shrink-0",
          failed ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {status === 0 ? "err" : status}
      </span>
      <span className="shrink-0 text-muted-foreground">
        {Math.round(duration)}ms
      </span>
    </span>
  );
}
