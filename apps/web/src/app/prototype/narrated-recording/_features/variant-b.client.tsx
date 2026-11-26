"use client";

// PROTOTYPE, throwaway. Variant B, "Transcript first": the narration is a
// document to read, with what happened set between the sentences. The replay
// is the illustration, beside it. For a team that reads before it watches.
import { cn } from "@workspace/ui/lib/utils";
import { Fragment, useEffect, useRef } from "react";
import { Clock, PlayButton, SkipSilence, Speeds } from "./controls.client";
import {
  currentVoiceIndex,
  DURATION_MS,
  ENTRIES,
  type Entry,
  entryText,
  entryTone,
  PAGES,
  timecode,
  VOICE,
} from "./data";
import { FakePage } from "./fake-page";
import { useFakePlayback } from "./use-fake-playback";

// Each sentence, then the entries that fall before the next one starts.
const BLOCKS = VOICE.map((line, index) => {
  const from = index === 0 ? 0 : line.start;
  const until = VOICE[index + 1]?.start ?? DURATION_MS;
  return {
    line,
    entries: ENTRIES.filter(
      (entry) => entry.time >= from && entry.time < until,
    ),
    page: PAGES.find(
      (page) => line.start >= page.start && line.start < page.end,
    ),
  };
});

export function VariantB() {
  const playback = useFakePlayback([1, 1.25, 1.5, 2]);
  const { time, seek } = playback;
  const current = currentVoiceIndex(time);
  const readerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    readerRef.current
      ?.querySelector('[data-current="true"]')
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [current]);

  return (
    <div className="flex min-h-0 flex-1">
      <div ref={readerRef} className="min-w-0 flex-1 overflow-y-auto">
        <article className="mx-auto max-w-[62ch] px-8 py-10">
          <h2 className="text-lg font-semibold">Transcript</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Camille Roy, 1 min 48 s, 2 pages, 3 errors. Select a sentence or an
            entry to play from there.
          </p>
          {BLOCKS.map(({ line, entries, page }, index) => (
            <Fragment key={line.start}>
              {page && BLOCKS[index - 1]?.page !== page && (
                <h3 className="mt-10 mb-3 flex items-baseline gap-3 border-b pb-2 font-mono text-xs text-muted-foreground">
                  {page.path}
                  {index > 0 && (
                    <span className="font-sans italic">
                      after a page load, 1.6 s not recorded
                    </span>
                  )}
                </h3>
              )}
              <Sentence
                start={line.start}
                end={line.end}
                text={line.text}
                time={time}
                state={sentenceState(index, current)}
                onSeek={seek}
              />
              {entries.length > 0 && (
                <ul className="my-2 ml-12 flex flex-col border-l pl-3">
                  {entries
                    .filter((entry) => entry.kind !== "gap")
                    .map((entry, entryIndex) => (
                      <Aside
                        key={entryIndex}
                        entry={entry}
                        isPast={entry.time <= time}
                        onSeek={seek}
                      />
                    ))}
                </ul>
              )}
            </Fragment>
          ))}
        </article>
      </div>
      <div className="flex w-[44%] max-w-2xl shrink-0 flex-col border-l">
        <div
          role="button"
          tabIndex={-1}
          aria-label="Play or pause"
          className="min-h-0 flex-1 cursor-default"
          onClick={playback.toggle}
        >
          <FakePage time={time} />
        </div>
        <div
          className="relative h-1.5 shrink-0 cursor-pointer bg-muted"
          onPointerDown={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            seek(((event.clientX - box.left) / box.width) * DURATION_MS);
          }}
        >
          <div
            className="h-full bg-foreground/50"
            style={{ width: `${String((time / DURATION_MS) * 100)}%` }}
          />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3 px-4 py-2">
          <PlayButton playback={playback} />
          <Clock time={time} />
          <Speeds playback={playback} />
          <span className="ml-auto">
            <SkipSilence playback={playback} />
          </span>
        </div>
      </div>
    </div>
  );
}

type SentenceProps = {
  start: number;
  end: number;
  text: string;
  time: number;
  state: "past" | "current" | "next";
  onSeek: (time: number) => void;
};

// The words light up as they are said, spread evenly over the sentence.
function Sentence({ start, end, text, time, state, onSeek }: SentenceProps) {
  const words = text.split(" ");
  let said = 0;
  if (state === "current") {
    said = Math.ceil(((time - start) / (end - start)) * words.length);
  } else if (state === "past") {
    said = words.length;
  }

  return (
    <button
      type="button"
      data-current={state === "current"}
      onClick={() => onSeek(start)}
      className="group flex w-full cursor-pointer gap-3 rounded-sm py-1.5 text-left"
    >
      <span className="w-9 shrink-0 pt-1 text-right font-mono text-xs text-muted-foreground tabular-nums group-hover:text-foreground">
        {timecode(start)}
      </span>
      <span className="text-base leading-relaxed">
        {words.map((word, index) => (
          <span
            key={index}
            className={cn(
              "transition-colors",
              index < said ? "text-foreground" : "text-muted-foreground",
              state === "current" && index < said && "font-medium",
            )}
          >
            {word}{" "}
          </span>
        ))}
      </span>
    </button>
  );
}

type AsideProps = {
  entry: Entry;
  isPast: boolean;
  onSeek: (time: number) => void;
};

function Aside({ entry, isPast, onSeek }: AsideProps) {
  const tone = entryTone(entry);
  return (
    <li>
      <button
        type="button"
        onClick={() => onSeek(entry.time)}
        className={cn(
          "flex w-full cursor-pointer gap-2 rounded-sm py-0.5 text-left text-xs hover:bg-muted/60",
          entry.kind === "step" ? "text-muted-foreground" : "font-mono",
          tone === "error" && "text-destructive",
          tone === "warning" && "text-amber-700 dark:text-amber-400",
          !isPast && "opacity-60",
        )}
      >
        <span className="shrink-0 font-mono tabular-nums opacity-70">
          {timecode(entry.time)}
        </span>
        <span className="min-w-0 break-words">{entryText(entry)}</span>
      </button>
    </li>
  );
}

function sentenceState(index: number, current: number) {
  if (index === current) {
    return "current";
  }
  return index < current ? "past" : "next";
}
