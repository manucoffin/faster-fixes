import { cn } from "@workspace/ui/lib/utils";
import { Video } from "lucide-react";
import { formatFeedbackTime } from "../_helpers/format-timecode";

type VideoSourceLineProps = {
  title: string;
  startMs: number | null;
  endMs: number | null;
  className?: string;
};

// Where a video Feedback points, in place of a page Feedback's path.
export function VideoSourceLine({
  title,
  startMs,
  endMs,
  className,
}: VideoSourceLineProps) {
  return (
    <p
      className={cn(
        "flex min-w-0 items-center gap-1 text-xs text-muted-foreground",
        className,
      )}
    >
      <Video className="size-3.5 shrink-0" aria-hidden />
      <span className="truncate" title={title}>
        {title}
      </span>
      {startMs !== null && (
        <span className="shrink-0 tabular-nums">
          {formatFeedbackTime(startMs, endMs, { milliseconds: false })}
        </span>
      )}
    </p>
  );
}
