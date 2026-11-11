/* eslint-disable react-hooks/refs, react-hooks/set-state-in-effect, local/no-raw-tailwind-colors, local/require-named-props-type -- throwaway prototype, wayfinder ticket 377 */
"use client";

// PROTOTYPE (wayfinder ticket 377, "Inbox playback of a Recording prototype").
// Throwaway: plays one sample Recording of a fake site, whatever the Feedback.

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { Pause, Play } from "lucide-react";
import {
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const BASE = "/_prototype-recording";
export const SAMPLE_SCREENSHOT = `${BASE}/screenshot.png`;

export type EntryKind = "step" | "console" | "network";
export type EntryTone = "neutral" | "warn" | "error";
export type TimelineEntry = {
  id: string;
  kind: EntryKind;
  t: number;
  durationMs?: number;
  label: string;
  tone: EntryTone;
};

type Meta = {
  startedAt: number;
  viewport: { width: number; height: number };
  selection: { x: number; y: number; width: number; height: number };
  trail: {
    console: { level: string; message: string; timestamp: number }[];
    network: {
      method: string;
      url: string;
      status: number;
      duration: number;
      timestamp: number;
    }[];
  };
};

type SnapshotNode = {
  id: number;
  tagName?: string;
  attributes?: Record<string, unknown>;
  textContent?: string;
  childNodes?: SnapshotNode[];
};

type ReplayEvent = {
  type: number;
  timestamp: number;
  data: {
    source?: number;
    type?: number;
    id?: number;
    node?: SnapshotNode;
  };
};

function nodeText(node: SnapshotNode): string {
  if (node.textContent) return node.textContent;
  return (node.childNodes ?? []).map(nodeText).join(" ");
}

function describe(node: SnapshotNode | undefined) {
  if (!node) return "the page";
  const placeholder = node.attributes?.placeholder;
  if (typeof placeholder === "string") return `"${placeholder}"`;
  const text = nodeText(node).replace(/\s+/g, " ").trim().slice(0, 28);
  return text ? `"${text}"` : `<${node.tagName ?? "element"}>`;
}

// What the server would derive for the agent timeline: clicks and typing, by element.
function deriveSteps(events: ReplayEvent[]): TimelineEntry[] {
  const start = events[0]?.timestamp ?? 0;
  const nodes = new Map<number, SnapshotNode>();
  const index = (node: SnapshotNode) => {
    nodes.set(node.id, node);
    node.childNodes?.forEach(index);
  };
  const steps: TimelineEntry[] = [];
  let lastInputId: number | undefined;
  for (const event of events) {
    if (event.type === 2 && event.data.node) index(event.data.node);
    if (event.type !== 3) continue;
    const { source, type, id } = event.data;
    if (source === 2 && type === 2) {
      lastInputId = undefined;
      steps.push({
        id: `step-${event.timestamp}`,
        kind: "step",
        t: event.timestamp - start,
        label: `Clicked ${describe(nodes.get(id ?? -1))}`,
        tone: "neutral",
      });
    }
    if (source === 5 && id !== lastInputId) {
      lastInputId = id;
      steps.push({
        id: `step-${event.timestamp}`,
        kind: "step",
        t: event.timestamp - start,
        label: `Typed in ${describe(nodes.get(id ?? -1))}`,
        tone: "neutral",
      });
    }
  }
  return steps;
}

const LEVEL_TONE: Record<string, EntryTone> = { error: "error", warn: "warn" };

function trailEntries(meta: Meta, start: number): TimelineEntry[] {
  const consoleEntries = meta.trail.console.map(
    (entry, i): TimelineEntry => ({
      id: `console-${i}`,
      kind: "console",
      t: entry.timestamp - start,
      label: entry.message,
      tone: LEVEL_TONE[entry.level] ?? "neutral",
    }),
  );
  const networkEntries = meta.trail.network.map(
    (entry, i): TimelineEntry => ({
      id: `network-${i}`,
      kind: "network",
      t: entry.timestamp - start,
      durationMs: entry.duration,
      label: `${entry.method} ${new URL(entry.url).pathname} ${entry.status}`,
      tone: entry.status === 0 || entry.status >= 400 ? "error" : "neutral",
    }),
  );
  return [...consoleEntries, ...networkEntries];
}

async function loadSample() {
  const [gz, meta] = await Promise.all([
    fetch(`${BASE}/recording.json.gz`),
    fetch(`${BASE}/meta.json`).then((r) => r.json() as Promise<Meta>),
  ]);
  if (!gz.body) throw new Error("No body");
  const text = await new Response(
    gz.body.pipeThrough(new DecompressionStream("gzip")),
  ).text();
  const events = JSON.parse(text) as ReplayEvent[];
  return { events, meta };
}

export type PlayerStatus = "loading" | "ready" | "broken";
export type Assets = { missingImages: number; missingFonts: number };

export type Player = ReturnType<typeof useRecordingPlayer>;

export function useRecordingPlayer(options: { forceBroken: boolean }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<PlayerStatus>("loading");
  const [t, setT] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeedState] = useState(1);
  const [assets, setAssets] = useState<Assets | null>(null);
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);

  const post = useCallback((message: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(message, "*");
  }, []);

  useEffect(() => {
    if (options.forceBroken) {
      setStatus("broken");
      return;
    }
    let loading = false;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const message = event.data as {
        type: string;
        t?: number;
        playing?: boolean;
        duration?: number;
        missingImages?: number;
        missingFonts?: number;
      };
      if (message.type === "boot") {
        if (loading) return;
        loading = true;
        loadSample()
          .then(({ events, meta: loaded }) => {
            const start = events[0]?.timestamp ?? 0;
            setMeta(loaded);
            setEntries(
              [...deriveSteps(events), ...trailEntries(loaded, start)].sort(
                (a, b) => a.t - b.t,
              ),
            );
            post({ type: "load", events });
          })
          .catch(() => setStatus("broken"));
      }
      if (message.type === "ready") {
        setDuration(message.duration ?? 0);
        setT(message.duration ?? 0);
        setStatus("ready");
      }
      if (message.type === "time") {
        setT(message.t ?? 0);
        setPlaying(message.playing ?? false);
      }
      if (message.type === "assets") {
        setAssets({
          missingImages: message.missingImages ?? 0,
          missingFonts: message.missingFonts ?? 0,
        });
      }
      if (message.type === "error") setStatus("broken");
    };
    window.addEventListener("message", onMessage);
    // The frame may have booted before this listener existed.
    post({ type: "ping" });
    return () => window.removeEventListener("message", onMessage);
  }, [options.forceBroken, post]);

  return {
    iframeRef,
    status,
    t,
    duration,
    playing,
    speed,
    assets,
    entries,
    meta,
    toggle: () => post({ type: playing ? "pause" : "play", at: t }),
    seek: (at: number) => post({ type: "seek", at }),
    setSpeed: (next: number) => {
      setSpeedState(next);
      post({ type: "speed", speed: next });
    },
  };
}

export function formatClock(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

type StageProps = {
  player: Player;
  showFrame: boolean;
  className?: string;
};

// The replayed page lives in its own framed document; the Selection frame is
// drawn by the dashboard on top of it, only on the last instant.
export function Stage({ player, showFrame, className }: StageProps) {
  const { meta, status } = player;
  const atEnd = player.duration > 0 && player.t >= player.duration - 60;
  const selection = meta?.selection;

  if (status === "broken") {
    return (
      <div
        className={cn(
          "flex aspect-[16/10] w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed text-center text-xs text-muted-foreground",
          className,
        )}
      >
        <span className="text-sm text-foreground">
          This recording cannot be played.
        </span>
        The screenshot shows the page as the reviewer saw it.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-[16/10] w-full overflow-hidden rounded-md border bg-neutral-900",
        className,
      )}
    >
      <iframe
        ref={player.iframeRef}
        src={`${BASE}/player.html`}
        title="Recording"
        // rrweb cannot build its own script-less iframe from an opaque origin,
        // so allow-same-origin is needed. Real isolation needs another host.
        sandbox="allow-scripts allow-same-origin"
        className="absolute inset-0 size-full border-0"
      />
      <button
        type="button"
        aria-label={player.playing ? "Pause" : "Play"}
        onClick={player.toggle}
        className="absolute inset-0 cursor-pointer"
      />
      {showFrame && atEnd && selection && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            className="absolute rounded-[2px] border-2 border-primary ring-1 ring-background"
            style={{
              left: `${selection.x * 100}%`,
              top: `${selection.y * 100}%`,
              width: `${selection.width * 100}%`,
              height: `${selection.height * 100}%`,
            }}
          />
        </div>
      )}
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-400">
          Loading recording
        </div>
      )}
    </div>
  );
}

export function AssetsNotice({
  player,
  hidden,
}: {
  player: Player;
  hidden: boolean;
}) {
  const { assets } = player;
  if (hidden || !assets) return null;
  if (assets.missingImages + assets.missingFonts === 0) return null;
  return (
    <p className="text-xs text-muted-foreground">
      Some fonts and images could not be loaded, so the page may look different
      from what the reviewer saw. The screenshot is exact.
    </p>
  );
}

const SPEEDS = [1, 2, 4];

export function PlayButton({ player }: { player: Player }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={player.playing ? "Pause" : "Play"}
      onClick={player.toggle}
      disabled={player.status !== "ready"}
    >
      {player.playing ? <Pause /> : <Play />}
    </Button>
  );
}

export function Clock({ player }: { player: Player }) {
  return (
    <span className="font-mono text-xs text-muted-foreground tabular-nums">
      {formatClock(player.t)} / {formatClock(player.duration)}
    </span>
  );
}

export function SpeedButton({ player }: { player: Player }) {
  const next = SPEEDS[(SPEEDS.indexOf(player.speed) + 1) % SPEEDS.length] ?? 1;
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 px-2 font-mono text-xs tabular-nums"
      onClick={() => player.setSpeed(next)}
    >
      {player.speed}x
    </Button>
  );
}

const TONE_CLASS: Record<EntryTone, string> = {
  neutral: "bg-muted-foreground/60",
  warn: "bg-amber-500",
  error: "bg-destructive",
};

export function toneClass(tone: EntryTone) {
  return TONE_CLASS[tone];
}

type ScrubberProps = {
  player: Player;
  /** Rendered inside the track, positioned by the caller. */
  children?: ReactNode;
  className?: string;
};

export function Scrubber({ player, children, className }: ScrubberProps) {
  const ref = useRef<HTMLDivElement>(null);
  const seekFrom = (event: PointerEvent<HTMLDivElement>) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box || player.duration === 0) return;
    const ratio = Math.min(
      1,
      Math.max(0, (event.clientX - box.left) / box.width),
    );
    player.seek(ratio * player.duration);
  };
  const progress = player.duration ? (player.t / player.duration) * 100 : 0;

  return (
    <div
      ref={ref}
      role="slider"
      aria-label="Recording position"
      aria-valuemin={0}
      aria-valuemax={Math.round(player.duration)}
      aria-valuenow={Math.round(player.t)}
      tabIndex={0}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        seekFrom(event);
      }}
      onPointerMove={(event) => {
        if (event.buttons === 1) seekFrom(event);
      }}
      className={cn("relative h-6 cursor-pointer touch-none", className)}
    >
      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" />
      <div
        className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-primary"
        style={{ width: `${progress}%` }}
      />
      {children}
      <div
        className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary shadow"
        style={{ left: `${progress}%` }}
      />
    </div>
  );
}
