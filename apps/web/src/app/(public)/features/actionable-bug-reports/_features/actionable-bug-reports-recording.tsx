import { cn } from "@workspace/ui/lib/utils";
import { CircleDashedIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { SectionBody } from "../../_components/section-body";
import { SectionHeading } from "../../_components/section-heading";
import { InboxPlayerAnimation } from "../_components/illustrations/inbox-player-animation";
import { RecordingReplayAnimation } from "../_components/illustrations/recording-replay-animation";
import { TypedNeverCapturedAnimation } from "../../_components/typed-never-captured-animation";

type TimelineEntry = {
  time: string;
  kind: string;
  detail: string;
  tone?: "error" | "selection";
};

const timelineEntries: TimelineEntry[] = [
  {
    time: "-12.4 s",
    kind: "click",
    detail: 'button "Save changes" (form.settings > button.primary)',
  },
  {
    time: "-12.0 s",
    kind: "POST",
    detail: "https://example.com/api/settings → 500 (120ms)",
    tone: "error",
  },
  { time: "-11.0 s", kind: "error", detail: "Save failed", tone: "error" },
  {
    time: "0.0 s",
    kind: "selection",
    detail: 'button "Save changes" (#save), the element the comment is about',
    tone: "selection",
  },
];

export function ActionableBugReportsRecording() {
  return (
    <section className="w-full py-20 md:py-28">
      <div className="container mx-auto px-4">
        <SectionHeading>
          The Recording: the last minute before the report
        </SectionHeading>

        <div className="mt-12 grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionBody>
            <p>
              A Recording is a session replay scoped to one Feedback. It covers
              up to about the last minute on the page before the Reviewer
              selected the element, and it attaches automatically, with no extra
              step for the Reviewer. The widget states it plainly:{" "}
              <span className="text-foreground">
                &quot;Includes the last minute on this page.&quot;
              </span>
            </p>
            <p>
              A Recording reconstructs the page, with its DOM structure, text,
              styles and image URLs, and adds the Reviewer&apos;s clicks,
              scrolling and pointer movement. It is not a video of the screen
              and it carries no audio.
            </p>
          </SectionBody>

          <RecordingReplayAnimation />
        </div>

        <div className="mt-20 grid grid-cols-1 items-center gap-12 md:mt-24 lg:grid-cols-2 lg:gap-16">
          <SectionBody>
            <p>
              Some things are never captured: the value of any input, textarea,
              select, and contenteditable text.{" "}
              <span className="text-foreground">
                The Recording shows that the Reviewer typed and where, not what.
              </span>{" "}
              The widget&apos;s UI, canvas, video frames and third-party iframes
              stay out as well.
            </p>
          </SectionBody>

          <div className="lg:order-first">
            <TypedNeverCapturedAnimation />
          </div>
        </div>

        <div className="mt-16 flex max-w-3xl gap-4 md:mt-20">
          <CircleDashedIcon
            aria-hidden
            className="mt-1.5 size-5 shrink-0 text-muted-foreground"
          />
          <SectionBody>
            <p>
              <span className="text-foreground">
                A Recording is best effort.
              </span>{" "}
              A Feedback is still submitted without one when capture fails, for
              example past the 4 MB compressed size cap or when a content
              security policy blocks it. Set <code>captureRecording</code> to{" "}
              <code>false</code> to turn it off. To mask or block parts of a
              page, use <code>data-ff-mask</code> and <code>data-ff-block</code>
              : the{" "}
              <Link href={"/features/website-annotation" as Route}>
                website annotation page
              </Link>{" "}
              and the{" "}
              <Link href={"/docs/widget/recording" as Route}>
                Recording documentation
              </Link>{" "}
              cover the details.
            </p>
          </SectionBody>
        </div>

        <div className="mt-20 grid grid-cols-1 items-center gap-12 border-t pt-20 md:mt-24 md:pt-24 lg:grid-cols-2 lg:gap-16">
          <div>
            <h3 className="text-xl font-medium tracking-tight">The Timeline</h3>
            <SectionBody className="mt-4">
              <p>
                A Timeline merges what the Reviewer did (page loads, clicks,
                typing, selections, navigations, scrolling and resizing) with
                the console logs and network requests on one clock. Each entry
                shows its time before the Selection, and the last line is the
                selected element.
              </p>
            </SectionBody>
          </div>

          <TimelinePanel />
        </div>

        <div className="mt-20 grid grid-cols-1 items-center gap-12 md:mt-24 lg:grid-cols-2 lg:gap-16">
          <div>
            <h3 className="text-xl font-medium tracking-tight">
              Reading a Recording in the inbox
            </h3>
            <SectionBody className="mt-4">
              <p>
                The player has play, pause and playback speed, next to a log of
                Steps, Console and Network entries in time order, filterable by
                source. Clicking an entry seeks the player to that moment, and
                the log follows playback.
              </p>
            </SectionBody>
          </div>

          <div className="lg:order-first">
            <InboxPlayerAnimation />
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelinePanel() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-background">
      <div className="border-b px-5 py-3 font-mono text-xs text-muted-foreground">
        Timeline
      </div>
      <ol className="divide-y font-mono text-sm">
        {timelineEntries.map((entry) => (
          <li
            key={entry.time}
            className={cn(
              "grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1 px-5 py-3 sm:grid-cols-[4.5rem_5.5rem_1fr]",
              entry.tone === "selection" && "bg-muted/60",
            )}
          >
            <span className="text-right text-muted-foreground tabular-nums">
              {entry.time}
            </span>
            <span
              className={cn(
                entry.tone === "error"
                  ? "text-destructive"
                  : "text-muted-foreground",
                entry.tone === "selection" && "text-foreground",
              )}
            >
              {entry.kind}
            </span>
            <span className="col-start-2 min-w-0 break-words sm:col-start-auto">
              {entry.detail}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
