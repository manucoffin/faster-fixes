"use client";

// PROTOTYPE, throwaway. Variant A, "Voice in the log": the existing Recording
// stage, where the voice is a fourth source of the log and a band on the
// timeline. Smallest change to what ships today.
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Clock, PlayButton, Speeds } from "./controls.client";
import {
  DURATION_MS,
  ENTRIES,
  type Entry,
  entryText,
  entryTone,
  GAPS,
  timecode,
  VOICE,
} from "./data";
import { FakePage } from "./fake-page";
import { useFakePlayback } from "./use-fake-playback";

const SOURCES = ["voice", "step", "console", "network"] as const;
type Source = (typeof SOURCES)[number];
const LABEL: Record<Source, string> = {
  voice: "Voice",
  step: "Steps",
  console: "Console",
  network: "Network",
};

type Line =
  | { source: "voice"; time: number; text: string }
  | { source: Exclude<Source, "voice"> | "gap"; time: number; entry: Entry };

const LINES: Line[] = [
  ...VOICE.map(
    (line): Line => ({ source: "voice", time: line.start, text: line.text }),
  ),
  ...ENTRIES.map(
    (entry): Line => ({ source: entry.kind, time: entry.time, entry }),
  ),
].sort((a, b) => a.time - b.time);

const pct = (ms: number) => `${String((ms / DURATION_MS) * 100)}%`;

export function VariantA() {
  const playback = useFakePlayback([1, 1.5, 2]);
  const { time, seek } = playback;
  const [hidden, setHidden] = useState<ReadonlySet<Source>>(() => new Set());
  const listRef = useRef<HTMLUListElement>(null);
  const lines = LINES.filter(
    (line) => line.source === "gap" || !hidden.has(line.source),
  );
  const current = lines.filter((line) => line.time <= time).length - 1;

  useEffect(() => {
    listRef.current
      ?.querySelector('[data-current="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [current]);

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <div
          role="button"
          tabIndex={-1}
          aria-label="Play or pause"
          className="min-h-0 flex-1 cursor-default"
          onClick={playback.toggle}
        >
          <FakePage time={time} />
        </div>
        <div className="flex shrink-0 items-center gap-3 border-t px-4 py-2">
          <PlayButton playback={playback} />
          <Clock time={time} />
          <div
            className="relative h-10 min-w-0 flex-1 cursor-pointer select-none"
            onPointerDown={(event) => {
              const box = event.currentTarget.getBoundingClientRect();
              seek(((event.clientX - box.left) / box.width) * DURATION_MS);
            }}
          >
            {/* When the Reviewer speaks, above the track. */}
            {VOICE.map((line) => (
              <span
                key={line.start}
                title={line.text}
                className="absolute top-1 h-1 rounded-full bg-foreground/50"
                style={{
                  left: pct(line.start),
                  width: pct(line.end - line.start),
                }}
              />
            ))}
            <div className="absolute inset-x-0 top-1/2 h-1.5 translate-y-0.5 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground/30"
                style={{ width: pct(time) }}
              />
            </div>
            {GAPS.map((gap) => (
              <span
                key={gap.start}
                title="Page load, not recorded"
                className="absolute top-1/2 h-3 -translate-y-0.5 border-x border-foreground/40 bg-background"
                style={{
                  left: pct(gap.start),
                  width: pct(gap.end - gap.start),
                }}
              />
            ))}
            {ENTRIES.filter((entry) => entry.kind !== "gap").map(
              (entry, index) => (
                <span
                  key={index}
                  title={`${timecode(entry.time)} ${entryText(entry)}`}
                  className={cn(
                    "absolute top-1/2 -translate-x-1/2",
                    entryTone(entry) === "error" &&
                      "z-10 h-3 w-1 -translate-y-0.5 rounded-sm bg-destructive",
                    entryTone(entry) === "warning" &&
                      "z-10 h-3 w-1 -translate-y-0.5 rounded-sm bg-amber-500",
                    entryTone(entry) === "plain" &&
                      "size-1.5 translate-y-0.5 rounded-full bg-muted-foreground/60",
                  )}
                  style={{ left: pct(entry.time) }}
                />
              ),
            )}
            <div
              className="pointer-events-none absolute inset-y-1 z-20 w-0.5 -translate-x-1/2 bg-foreground"
              style={{ left: pct(time) }}
            />
          </div>
          <Speeds playback={playback} />
        </div>
      </div>
      <aside className="flex w-96 shrink-0 flex-col border-l">
        <div
          role="group"
          aria-label="Log sources"
          className="flex shrink-0 gap-1 border-b p-2"
        >
          {SOURCES.map((source) => (
            <Button
              key={source}
              variant={hidden.has(source) ? "ghost" : "secondary"}
              size="sm"
              aria-pressed={!hidden.has(source)}
              className={cn(
                "h-7 px-2 text-xs",
                hidden.has(source) && "text-muted-foreground",
              )}
              onClick={() =>
                setHidden((set) => {
                  const next = new Set(set);
                  if (!next.delete(source)) next.add(source);
                  return next;
                })
              }
            >
              {LABEL[source]}
            </Button>
          ))}
        </div>
        <ul ref={listRef} className="min-h-0 flex-1 overflow-y-auto py-1">
          {lines.map((line, index) => (
            <li key={index} data-current={index === current}>
              <button
                type="button"
                onClick={() => seek(line.time)}
                className={cn(
                  "flex w-full cursor-pointer items-start gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted/60",
                  index === current && "bg-muted",
                  index > current && "opacity-50",
                )}
              >
                <span className="w-9 shrink-0 pt-px text-right font-mono text-muted-foreground tabular-nums">
                  {timecode(line.time)}
                </span>
                {line.source === "voice" ? (
                  <span className="flex min-w-0 flex-1 gap-2 text-sm leading-snug">
                    <Mic className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    {line.text}
                  </span>
                ) : (
                  <span
                    className={cn(
                      "min-w-0 flex-1 break-words",
                      line.source !== "step" &&
                        line.source !== "gap" &&
                        "font-mono",
                      line.source === "gap" && "text-muted-foreground italic",
                      entryTone(line.entry) === "error" && "text-destructive",
                      entryTone(line.entry) === "warning" &&
                        "text-amber-700 dark:text-amber-400",
                    )}
                  >
                    {entryText(line.entry)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
