/* eslint-disable local/require-named-props-type -- throwaway prototype, wayfinder ticket 377 */
"use client";

// PROTOTYPE (wayfinder ticket 377): three variants of the Recording in the
// Feedback detail, switchable via `?variant=A|B|C`, on the existing inbox route.
// `?recording=missing|ok|broken|none` forces the state of the Recording.

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { cn } from "@workspace/ui/lib/utils";
import { ChevronLeft, ChevronRight, Play, Trash2 } from "lucide-react";
import { useQueryState } from "nuqs";
import { type ReactNode, useEffect, useId, useState } from "react";
import { ScreenshotDialog } from "../screenshot-dialog.client";
import {
  AssetsNotice,
  Clock,
  type EntryKind,
  formatClock,
  PlayButton,
  type Player,
  SAMPLE_SCREENSHOT,
  Scrubber,
  SpeedButton,
  Stage,
  type TimelineEntry,
  toneClass,
  useRecordingPlayer,
} from "./player.client";

const VARIANTS = [
  { key: "A", name: "Recording takes the Screenshot's place" },
  { key: "B", name: "Screenshot stays, Recording opens in a theater" },
  { key: "C", name: "Screenshot and Recording stacked, with lanes" },
] as const;
const STATES = ["missing", "ok", "broken", "none"] as const;
type RecordingState = (typeof STATES)[number];

const SAMPLE_FRAME = (
  <div aria-hidden className="pointer-events-none absolute inset-0">
    <div
      className="absolute rounded-[2px] border-2 border-primary ring-1 ring-background"
      style={{ left: "69.14%", top: "38.5%", width: "8.62%", height: "4.63%" }}
    />
  </div>
);

function SampleScreenshot() {
  return <ScreenshotDialog src={SAMPLE_SCREENSHOT} overlay={SAMPLE_FRAME} />;
}

function FrameSwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">
        Show selection frame
      </Label>
    </div>
  );
}

function RemoveRecording({
  onRemove,
  children,
}: {
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove recording</AlertDialogTitle>
          <AlertDialogDescription>
            The recording is deleted permanently. The feedback and its
            screenshot are kept.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onRemove}>
            Remove recording
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RemoveIconButton({ onRemove }: { onRemove: () => void }) {
  return (
    <RemoveRecording onRemove={onRemove}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Remove recording"
        title="Remove recording"
      >
        <Trash2 />
      </Button>
    </RemoveRecording>
  );
}

function summarize(entries: TimelineEntry[]) {
  const errors = entries.filter(
    (e) => e.kind === "console" && e.tone === "error",
  ).length;
  const failed = entries.filter(
    (e) => e.kind === "network" && e.tone === "error",
  ).length;
  const parts = [];
  if (errors) {
    parts.push(`${errors} console ${errors > 1 ? "errors" : "error"}`);
  }
  if (failed) {
    parts.push(`${failed} failed ${failed > 1 ? "requests" : "request"}`);
  }
  return parts.join(", ");
}

type VariantProps = {
  state: Exclude<RecordingState, "none">;
  onRemove: () => void;
};

// A: one media slot. The Recording opens paused on its last instant, which is
// the Screenshot's instant, and the Diagnostic Trail rides on the scrubber.
function VariantA({ state, onRemove }: VariantProps) {
  const player = useRecordingPlayer({ forceBroken: state === "broken" });
  const [tab, setTab] = useState(
    state === "broken" ? "screenshot" : "recording",
  );
  const [showFrame, setShowFrame] = useState(true);
  const [hovered, setHovered] = useState<TimelineEntry | null>(null);
  const markers = player.entries.filter(
    (e) => e.kind === "step" || e.tone !== "neutral",
  );

  return (
    <Tabs value={tab} onValueChange={setTab} className="gap-3">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="recording">Recording</TabsTrigger>
          <TabsTrigger value="screenshot">Screenshot</TabsTrigger>
        </TabsList>
        <RemoveIconButton onRemove={onRemove} />
      </div>
      <TabsContent value="recording" className="flex flex-col gap-2">
        <Stage player={player} showFrame={showFrame} />
        {player.status !== "broken" && (
          <>
            <div className="flex items-center gap-2">
              <PlayButton player={player} />
              <Scrubber player={player} className="flex-1">
                {markers.map((entry) => (
                  <span
                    key={entry.id}
                    onPointerEnter={() => setHovered(entry)}
                    onPointerLeave={() => setHovered(null)}
                    className={cn(
                      "absolute top-1/2 -translate-x-1/2 -translate-y-1/2",
                      entry.kind === "step"
                        ? "size-1.5 rounded-full"
                        : "h-3 w-1 rounded-sm",
                      toneClass(entry.tone),
                    )}
                    style={{ left: `${(entry.t / player.duration) * 100}%` }}
                  />
                ))}
              </Scrubber>
              <Clock player={player} />
              <SpeedButton player={player} />
            </div>
            <p className="h-4 truncate font-mono text-xs text-muted-foreground">
              {hovered
                ? `${formatClock(hovered.t)}  ${hovered.label}`
                : summarize(player.entries)}
            </p>
            <FrameSwitch checked={showFrame} onCheckedChange={setShowFrame} />
            <AssetsNotice player={player} hidden={state === "ok"} />
          </>
        )}
      </TabsContent>
      <TabsContent value="screenshot">
        <SampleScreenshot />
      </TabsContent>
    </Tabs>
  );
}

const KIND_LABEL: Record<EntryKind, string> = {
  step: "Step",
  console: "Console",
  network: "Network",
};

function EventLog({ player }: { player: Player }) {
  const [filter, setFilter] = useState<EntryKind | "all">("all");
  const shown = player.entries.filter(
    (e) => filter === "all" || e.kind === filter,
  );
  // The last entry at or before the playhead.
  const activeId = shown.filter((e) => e.t <= player.t).at(-1)?.id;

  useEffect(() => {
    if (!activeId || !player.playing) return;
    document
      .getElementById(`proto-entry-${activeId}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeId, player.playing]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex gap-1 border-b p-2">
        {(["all", "step", "console", "network"] as const).map((key) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={filter === key ? "secondary" : "ghost"}
            className="h-7 px-2 text-xs"
            onClick={() => setFilter(key)}
          >
            {key === "all" ? "All" : KIND_LABEL[key]}
          </Button>
        ))}
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {shown.map((entry) => (
          <li key={entry.id} id={`proto-entry-${entry.id}`}>
            <button
              type="button"
              onClick={() => player.seek(entry.t)}
              className={cn(
                "flex w-full cursor-pointer items-start gap-2 border-l-2 border-transparent px-3 py-1.5 text-left text-xs hover:bg-muted/60",
                entry.id === activeId && "border-primary bg-muted",
                entry.t > player.t && "opacity-50",
              )}
            >
              <span className="w-8 shrink-0 font-mono text-muted-foreground tabular-nums">
                {formatClock(entry.t)}
              </span>
              <span
                className={cn(
                  "mt-1 size-2 shrink-0 rounded-full",
                  toneClass(entry.tone),
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="mr-1 text-muted-foreground">
                  {KIND_LABEL[entry.kind]}
                </span>
                <span
                  className={cn(
                    "break-words",
                    entry.kind !== "step" && "font-mono",
                    entry.tone === "error" && "text-destructive",
                  )}
                >
                  {entry.label}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Theater({ state, onRemove }: VariantProps) {
  const player = useRecordingPlayer({ forceBroken: state === "broken" });
  const [showFrame, setShowFrame] = useState(true);

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Stage
            player={player}
            showFrame={showFrame}
            className="w-full max-w-[calc((100vh-14rem)*1.6)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <PlayButton player={player} />
          <Scrubber player={player} className="flex-1">
            {player.entries
              .filter((e) => e.kind === "step" || e.tone !== "neutral")
              .map((entry) => (
                <span
                  key={entry.id}
                  title={`${formatClock(entry.t)}  ${entry.label}`}
                  className={cn(
                    "absolute top-1/2 -translate-x-1/2 -translate-y-1/2",
                    entry.kind === "step"
                      ? "size-1.5 rounded-full"
                      : "h-3 w-1 rounded-sm",
                    toneClass(entry.tone),
                  )}
                  style={{ left: `${(entry.t / player.duration) * 100}%` }}
                />
              ))}
          </Scrubber>
          <Clock player={player} />
          <SpeedButton player={player} />
          <RemoveIconButton onRemove={onRemove} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <FrameSwitch checked={showFrame} onCheckedChange={setShowFrame} />
          <AssetsNotice player={player} hidden={state === "ok"} />
        </div>
      </div>
      <aside className="flex w-80 shrink-0 flex-col border-l">
        <EventLog player={player} />
      </aside>
    </div>
  );
}

// B: the detail panel is untouched apart from one row under the Screenshot.
// Playback gets the whole window, with one merged, time-ordered log beside it.
function VariantB({ state, onRemove }: VariantProps) {
  return (
    <div className="flex flex-col gap-3">
      <SampleScreenshot />
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className="flex cursor-pointer items-center gap-3 rounded-md border p-3 text-left hover:bg-muted/60"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Play className="size-4" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-medium">Play recording</span>
              <span className="text-xs text-muted-foreground">
                The 14 seconds before this feedback. 1 console error, 2 failed
                requests.
              </span>
            </span>
          </button>
        </DialogTrigger>
        <DialogContent className="flex h-[calc(100vh-2rem)] flex-col gap-0 p-0 sm:max-w-[calc(100%-2rem)]">
          <DialogTitle className="border-b px-4 py-3 text-sm">
            Recording
          </DialogTitle>
          <DialogDescription className="sr-only">
            Playback of the moments before the feedback
          </DialogDescription>
          <Theater state={state} onRemove={onRemove} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

const LANES: EntryKind[] = ["step", "console", "network"];

// C: both media inline. Under the player, one lane per source on a shared
// clock, the way browser devtools lay out a performance trace.
function VariantC({ state, onRemove }: VariantProps) {
  const player = useRecordingPlayer({ forceBroken: state === "broken" });
  const [showFrame, setShowFrame] = useState(true);
  const [hovered, setHovered] = useState<TimelineEntry | null>(null);
  const progress = player.duration ? (player.t / player.duration) * 100 : 0;

  return (
    <div className="flex flex-col gap-5">
      <SampleScreenshot />
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            Recording
            <span className="ml-2 font-normal text-muted-foreground">
              the {formatClock(player.duration)} before this feedback
            </span>
          </h3>
          <RemoveRecording onRemove={onRemove}>
            <Button type="button" variant="ghost" size="sm" className="text-xs">
              Remove recording
            </Button>
          </RemoveRecording>
        </div>
        <Stage player={player} showFrame={showFrame} />
        {player.status !== "broken" && (
          <>
            <div className="flex items-center gap-2">
              <PlayButton player={player} />
              <Clock player={player} />
              <SpeedButton player={player} />
              <div className="ml-auto">
                <FrameSwitch
                  checked={showFrame}
                  onCheckedChange={setShowFrame}
                />
              </div>
            </div>
            <div className="relative rounded-md border">
              {LANES.map((lane) => (
                <div
                  key={lane}
                  className="flex items-center border-b last:border-b-0"
                >
                  <span className="w-16 shrink-0 px-2 text-xs text-muted-foreground">
                    {KIND_LABEL[lane]}
                  </span>
                  <button
                    type="button"
                    aria-label={`Seek in ${KIND_LABEL[lane]} lane`}
                    className="relative h-7 flex-1 cursor-pointer border-l"
                    onClick={(event) => {
                      const box = event.currentTarget.getBoundingClientRect();
                      player.seek(
                        ((event.clientX - box.left) / box.width) *
                          player.duration,
                      );
                    }}
                  >
                    {player.entries
                      .filter((e) => e.kind === lane)
                      .map((entry) => (
                        <span
                          key={entry.id}
                          onPointerEnter={() => setHovered(entry)}
                          onPointerLeave={() => setHovered(null)}
                          className={cn(
                            "absolute top-1/2 h-3 min-w-1.5 -translate-y-1/2 rounded-sm",
                            toneClass(entry.tone),
                          )}
                          style={{
                            left: `${(entry.t / player.duration) * 100}%`,
                            width: entry.durationMs
                              ? `${(entry.durationMs / player.duration) * 100}%`
                              : undefined,
                          }}
                        />
                      ))}
                  </button>
                </div>
              ))}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 left-16"
              >
                <div
                  className="absolute inset-y-0 w-px bg-primary"
                  style={{ left: `${progress}%` }}
                />
              </div>
            </div>
            <p className="h-4 truncate font-mono text-xs text-muted-foreground">
              {hovered
                ? `${formatClock(hovered.t)}  ${hovered.label}`
                : "Hover a mark to read it, click a lane to seek."}
            </p>
            <AssetsNotice player={player} hidden={state === "ok"} />
          </>
        )}
      </section>
    </div>
  );
}

function PrototypeSwitcher({
  variant,
  state,
  setVariant,
  setState,
}: {
  variant: string;
  state: RecordingState;
  setVariant: (key: string) => void;
  setState: (state: RecordingState) => void;
}) {
  const index = Math.max(
    0,
    VARIANTS.findIndex((v) => v.key === variant),
  );
  const current = VARIANTS[index] ?? VARIANTS[0];

  useEffect(() => {
    const cycle = (delta: number) => {
      const next =
        VARIANTS[(index + delta + VARIANTS.length) % VARIANTS.length];
      if (next) setVariant(next.key);
    };
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest("input, textarea, [contenteditable], [role=slider]")
      ) {
        return;
      }
      if (event.key === "ArrowLeft") cycle(-1);
      if (event.key === "ArrowRight") cycle(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, setVariant]);

  const step = (delta: number) => {
    const next = VARIANTS[(index + delta + VARIANTS.length) % VARIANTS.length];
    if (next) setVariant(next.key);
  };

  return (
    <div className="pointer-events-auto fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-black px-2 py-1 text-xs text-white shadow-lg">
      <button
        type="button"
        aria-label="Previous variant"
        className="cursor-pointer p-1"
        onClick={() => step(-1)}
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="whitespace-nowrap">
        {current.key} ({current.name})
      </span>
      <button
        type="button"
        aria-label="Next variant"
        className="cursor-pointer p-1"
        onClick={() => step(1)}
      >
        <ChevronRight className="size-4" />
      </button>
      <span className="h-4 w-px bg-white/30" />
      <button
        type="button"
        className="cursor-pointer rounded-full px-2 py-1 whitespace-nowrap hover:bg-white/10"
        onClick={() =>
          setState(
            STATES[(STATES.indexOf(state) + 1) % STATES.length] ?? "missing",
          )
        }
      >
        state: {state}
      </button>
    </div>
  );
}

export function usePrototypeVariant() {
  const [variant] = useQueryState("variant");
  return process.env.NODE_ENV === "production" ? null : variant;
}

/** Stands in for the Screenshot block of the detail panel. */
export function PrototypeRecordingMedia({ fallback }: { fallback: ReactNode }) {
  const [variant, setVariant] = useQueryState("variant");
  const [rawState, setRawState] = useQueryState("recording");
  const state: RecordingState = STATES.find((s) => s === rawState) ?? "missing";
  const props: VariantProps | null =
    state === "none"
      ? null
      : { state, onRemove: () => void setRawState("none") };

  return (
    <>
      {props === null && fallback}
      {/* Keyed so a state change remounts the player. */}
      {props && variant === "B" && <VariantB key={state} {...props} />}
      {props && variant === "C" && <VariantC key={state} {...props} />}
      {props && variant !== "B" && variant !== "C" && (
        <VariantA key={state} {...props} />
      )}
      <PrototypeSwitcher
        variant={variant ?? "A"}
        state={state}
        setVariant={(key) => void setVariant(key)}
        setState={(next) => void setRawState(next)}
      />
    </>
  );
}
