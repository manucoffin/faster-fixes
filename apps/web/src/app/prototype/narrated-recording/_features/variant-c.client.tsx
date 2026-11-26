"use client";

// PROTOTYPE, throwaway. Variant C, "Tracks": no side rail. The replay takes
// the width with the narration as captions, over one tall timeline with a
// lane per source. Requests show their duration, pages show their gap.
import { cn } from "@workspace/ui/lib/utils";
import { useState } from "react";
import { Clock, PlayButton, SkipSilence, Speeds } from "./controls.client";
import {
  currentVoiceIndex,
  DURATION_MS,
  ENTRIES,
  type Entry,
  entryText,
  entryTone,
  GAPS,
  PAGES,
  timecode,
  VOICE,
} from "./data";
import { FakePage } from "./fake-page";
import { useFakePlayback } from "./use-fake-playback";

const pct = (ms: number) => `${String((ms / DURATION_MS) * 100)}%`;
const byKind = (kind: Entry["kind"]) =>
  ENTRIES.filter((entry) => entry.kind === kind);

const TONE_CLASS = {
  plain: "bg-muted-foreground/60",
  warning: "bg-amber-500",
  error: "bg-destructive",
};

export function VariantC() {
  const playback = useFakePlayback([1, 1.5, 2]);
  const { time, seek } = playback;
  const [hovered, setHovered] = useState<{ time: number; text: string } | null>(
    null,
  );
  const voice = VOICE[currentVoiceIndex(time)];
  const caption = voice && time < voice.end + 600 ? voice.text : null;
  // What the strip under the lanes reads: the hovered item, else the last one.
  const last = ENTRIES.filter((entry) => entry.time <= time).at(-1);
  const detail =
    hovered ?? (last ? { time: last.time, text: entryText(last) } : null);

  const hover = (at: number, text: string) => ({
    onPointerEnter: () => setHovered({ time: at, text }),
    onPointerLeave: () => setHovered(null),
    onClick: (event: React.MouseEvent) => {
      event.stopPropagation();
      seek(at);
    },
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        role="button"
        tabIndex={-1}
        aria-label="Play or pause"
        className="relative min-h-0 flex-1 cursor-default"
        onClick={playback.toggle}
      >
        <FakePage time={time} />
        {caption && (
          <span className="absolute inset-x-0 bottom-5 mx-auto w-fit max-w-[60ch] rounded-md bg-foreground/90 px-3 py-1.5 text-sm text-background">
            {caption}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3 border-t px-4 py-1.5">
        <PlayButton playback={playback} />
        <Clock time={time} />
        <p className="min-w-0 flex-1 truncate text-xs">
          {detail && (
            <>
              <span className="font-mono text-muted-foreground tabular-nums">
                {timecode(detail.time)}
              </span>{" "}
              {detail.text}
            </>
          )}
        </p>
        <SkipSilence playback={playback} />
        <Speeds playback={playback} />
      </div>
      <div className="grid shrink-0 grid-cols-[5rem_1fr] border-t text-xs">
        <div className="flex flex-col border-r text-muted-foreground">
          {["Voice", "Steps", "Console", "Network", "Page"].map((label) => (
            <span key={label} className="flex h-8 items-center px-3">
              {label}
            </span>
          ))}
        </div>
        <div
          className="relative cursor-pointer select-none"
          onPointerDown={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            seek(((event.clientX - box.left) / box.width) * DURATION_MS);
          }}
        >
          <Lane>
            {VOICE.map((line, index) => (
              <span
                key={line.start}
                {...hover(line.start, line.text)}
                className={cn(
                  "absolute inset-y-1.5 truncate rounded-sm px-1.5 leading-5",
                  index === currentVoiceIndex(time) && time < line.end
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-foreground/20",
                )}
                style={{
                  left: pct(line.start),
                  width: pct(line.end - line.start),
                }}
              >
                {line.text}
              </span>
            ))}
          </Lane>
          <Lane>
            {byKind("step").map((entry, index) => (
              <span
                key={index}
                {...hover(entry.time, entryText(entry))}
                className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground/60 hover:bg-foreground"
                style={{ left: pct(entry.time) }}
              />
            ))}
          </Lane>
          <Lane>
            {byKind("console").map((entry, index) => (
              <span
                key={index}
                {...hover(entry.time, entryText(entry))}
                className={cn(
                  "absolute top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-sm",
                  TONE_CLASS[entryTone(entry)],
                )}
                style={{ left: pct(entry.time) }}
              />
            ))}
          </Lane>
          <Lane>
            {ENTRIES.map(
              (entry, index) =>
                entry.kind === "network" && (
                  <span
                    key={index}
                    {...hover(entry.time, entryText(entry))}
                    className={cn(
                      "absolute top-1/2 h-2 min-w-1.5 -translate-y-1/2 rounded-sm",
                      TONE_CLASS[entryTone(entry)],
                    )}
                    style={{
                      left: pct(entry.time),
                      width: pct(entry.duration),
                    }}
                  />
                ),
            )}
          </Lane>
          <Lane>
            {PAGES.map((page) => (
              <span
                key={page.path}
                className="absolute inset-y-1.5 truncate rounded-sm border px-1.5 font-mono leading-[1.125rem] text-muted-foreground"
                style={{
                  left: pct(page.start),
                  width: pct(page.end - page.start),
                }}
              >
                {page.path}
              </span>
            ))}
            {GAPS.map((gap) => (
              <span
                key={gap.start}
                {...hover(gap.start, "Page loaded. 1.6 s not recorded.")}
                className="absolute inset-y-0"
                style={{
                  left: pct(gap.start),
                  width: pct(gap.end - gap.start),
                }}
              />
            ))}
          </Lane>
          {/* The page load cuts every lane: nothing was captured there. */}
          {GAPS.map((gap) => (
            <span
              key={gap.start}
              className="pointer-events-none absolute inset-y-0 border-x border-dashed border-foreground/30 bg-background/80"
              style={{ left: pct(gap.start), width: pct(gap.end - gap.start) }}
            />
          ))}
          <span
            className="pointer-events-none absolute inset-y-0 z-10 w-0.5 -translate-x-1/2 bg-foreground"
            style={{ left: pct(time) }}
          />
        </div>
      </div>
    </div>
  );
}

type LaneProps = { children: React.ReactNode };

function Lane({ children }: LaneProps) {
  return (
    <div className="relative h-8 border-b last:border-b-0">{children}</div>
  );
}
