import { TerminalFrame } from "@/app/(public)/(home)/_features/how-it-works/flow-animations";
import { MousePointer2Icon, PauseIcon, PlayIcon } from "lucide-react";
import type { ReactNode } from "react";

const CYCLE = 12;

// Percentages of the cycle.
const SEEK = 14;
const SPEED_CLICK = 21;
const PLAY_CLICK = 27;
const CURSOR_BACK = 36;
const RESET = 94;
// A moment between the end of playback and the reset, where the
// reduced-motion block freezes every element.
const FREEZE = 90;

// Length of a fade, and of a discrete switch, in percentages of the cycle.
const FADE = 2;
const SWITCH = 0.3;

// The Recording, in seconds: the Selection closes it at DURATION. The player
// opens paused at INITIAL_TIME and plays at SPEED once the Member presses play.
const DURATION = 58;
const INITIAL_TIME = 12;
const SPEED = 2;

type LogEntry = {
  // Seconds into the Recording.
  time: number;
  content: ReactNode;
  tone?: "error" | "selection";
};

const SEEKED_ENTRY = 2;
// The click on "Save changes", the entry the Member seeks to.
const SEEK_TIME = 45.6;

const LOG: LogEntry[] = [
  { time: 0.2, content: <StepLine text="load /settings" /> },
  { time: 26.5, content: <StepLine text='input "Display name"' /> },
  { time: SEEK_TIME, content: <StepLine text='click "Save changes"' /> },
  {
    time: 46,
    tone: "error",
    content: (
      <>
        <span className="shrink-0 text-zinc-500">POST</span>
        <span className="min-w-0 flex-1 truncate text-zinc-300">
          /api/settings
        </span>
        <span className="shrink-0 text-red-400">500</span>
        <span className="hidden shrink-0 text-zinc-500 @[36rem]:inline">
          120ms
        </span>
      </>
    ),
  },
  {
    time: 47,
    tone: "error",
    content: (
      <>
        <span className="shrink-0 text-red-400">ERROR</span>
        <span className="min-w-0 truncate text-zinc-300">Save failed</span>
      </>
    ),
  },
  {
    time: DURATION,
    tone: "selection",
    content: <StepLine text='selection "Save changes"' />,
  },
];

const SOURCES = ["Steps", "Console", "Network"] as const;
const SPEEDS = [1, 2, 4] as const;

// Where a moment of the Recording falls in the cycle once playback runs.
function playAt(time: number) {
  return PLAY_CLICK + ((time - SEEK_TIME) / SPEED / CYCLE) * 100;
}

const END = playAt(DURATION);

// Layout, as percentages of the frame content: the player on the left, its
// controls bar along the bottom, the log on the right with one row per entry.
const PLAYER_WIDTH = 58;
const CONTROLS_HEIGHT = 16;
const FILTERS_HEIGHT = 14;
const ROW_HEIGHT = 14;
// Controls bar, as percentages of the player width.
const BAR_PADDING = 2;
const PLAY_WIDTH = 8;
const SPEED_WIDTH = 8;

type Point = { x: number; y: number };

// Member's cursor stops, as percentages of the frame content.
const REST_POINT: Point = { x: 93, y: 8 };
const ENTRY_POINT: Point = {
  x: PLAYER_WIDTH + (100 - PLAYER_WIDTH) * 0.55,
  y: FILTERS_HEIGHT + (SEEKED_ENTRY + 0.5) * ROW_HEIGHT,
};
const CONTROLS_Y = 100 - CONTROLS_HEIGHT / 2;
const PLAY_POINT: Point = {
  x: ((BAR_PADDING + PLAY_WIDTH / 2) * PLAYER_WIDTH) / 100,
  y: CONTROLS_Y,
};
const SPEED_POINT: Point = {
  x:
    ((100 - BAR_PADDING - SPEED_WIDTH * (SPEEDS.length - 1.5)) * PLAYER_WIDTH) /
    100,
  y: CONTROLS_Y,
};

const CURSOR_PATH = [
  { at: 0, ...REST_POINT, click: false },
  { at: SEEK - 5, ...ENTRY_POINT, click: false },
  { at: SEEK, ...ENTRY_POINT, click: true },
  { at: SEEK + 2, ...ENTRY_POINT, click: false },
  { at: SPEED_CLICK - 1.5, ...SPEED_POINT, click: false },
  { at: SPEED_CLICK, ...SPEED_POINT, click: true },
  { at: SPEED_CLICK + 1.5, ...SPEED_POINT, click: false },
  { at: PLAY_CLICK - 1.5, ...PLAY_POINT, click: false },
  { at: PLAY_CLICK, ...PLAY_POINT, click: true },
  { at: PLAY_CLICK + 2, ...PLAY_POINT, click: false },
  { at: CURSOR_BACK, ...REST_POINT, click: false },
  { at: 100, ...REST_POINT, click: false },
] as const;

const CLICKS = CURSOR_PATH.filter(({ click }) => click);

// Replayed page, as percentages of the page area.
const SAVE_BUTTON = { x: 8, y: 68, width: 32, height: 12 };
const SAVE_POINT: Point = {
  x: SAVE_BUTTON.x + SAVE_BUTTON.width / 2,
  y: SAVE_BUTTON.y + SAVE_BUTTON.height / 2,
};
const INPUT_POINT: Point = { x: 46, y: 40 };
const DRIFT_POINT: Point = { x: 66, y: 54 };

const ARIA_LABEL =
  'Animation of the Recording player in the inbox. The log beside the replay lists Steps, Console and Network entries. A click on the entry click "Save changes" seeks the replay to that moment, the speed switches to 2x and playback starts. The highlighted entry then follows playback through POST /api/settings 500 and the console error Save failed, up to the Selection of the Save changes button.';

const HIDDEN = "opacity: 0;";
const SHOWN = "opacity: 1;";

// Final state of each animated class, for the reduced-motion block.
const frozenRules: string[] = [];

type Frame = readonly [at: number, css: string];

function keyframes(name: string, frames: Frame[], timing: string) {
  const frozen = frames.filter(([at]) => at <= FREEZE).at(-1)?.[1] ?? "";
  frozenRules.push(`.${name} { animation: none; ${frozen} }`);
  const stops = frames
    .map(([at, css]) => `${at.toFixed(2)}% { ${css} }`)
    .join(" ");
  return `@keyframes ${name} { ${stops} }
.${name} { ${frames[0]?.[1] ?? ""} animation: ${name} ${CYCLE}s ${timing} infinite; }`;
}

// Holds each value until the next change, then switches in SWITCH.
function stepped(name: string, initial: string, changes: Frame[]) {
  const frames: Frame[] = [[0, initial]];
  let previous = initial;
  for (const [at, css] of changes) {
    frames.push([at - SWITCH, previous], [at, css]);
    previous = css;
  }
  frames.push([100, previous]);
  return keyframes(name, frames, "linear");
}

// The entry the playback position has reached, as it changes over the cycle.
const CURRENT_CHANGES: [at: number, index: number][] = [
  [SEEK, SEEKED_ENTRY],
  ...LOG.slice(SEEKED_ENTRY + 1).map(
    ({ time }, i) => [playAt(time), SEEKED_ENTRY + 1 + i] as [number, number],
  ),
  [RESET, 0],
];

function logKeyframes() {
  return LOG.map((_, i) =>
    [
      stepped(
        `abr-player-current-${i}`,
        i === 0 ? SHOWN : HIDDEN,
        CURRENT_CHANGES.map(([at, index]) => [
          at,
          index === i ? SHOWN : HIDDEN,
        ]),
      ),
      // Entries past the playback position are dimmed, as in the inbox.
      stepped(
        `abr-player-ahead-${i}`,
        i > 0 ? "opacity: 0.45;" : SHOWN,
        CURRENT_CHANGES.map(([at, index]) => [
          at,
          i > index ? "opacity: 0.45;" : SHOWN,
        ]),
      ),
    ].join("\n"),
  ).join("\n");
}

type Timecode = { label: string; changes: Frame[] };

function formatTimecode(seconds: number) {
  return `0:${String(Math.floor(seconds)).padStart(2, "0")}`;
}

// One label per second shown, each visible while playback sits in it.
const TIMECODES: Timecode[] = [
  {
    label: formatTimecode(INITIAL_TIME),
    changes: [
      [SEEK, HIDDEN],
      [RESET, SHOWN],
    ],
  },
  ...Array.from(
    { length: DURATION - Math.floor(SEEK_TIME) + 1 },
    (_, i): Timecode => {
      const second = Math.floor(SEEK_TIME) + i;
      const from = second === Math.floor(SEEK_TIME) ? SEEK : playAt(second);
      const until = second === DURATION ? RESET : playAt(second + 1);
      return {
        label: formatTimecode(second),
        changes: [
          [from, SHOWN],
          [until, HIDDEN],
        ],
      };
    },
  ),
];

function timecodeKeyframes() {
  return TIMECODES.map(({ changes }, i) =>
    stepped(`abr-player-time-${i}`, i === 0 ? SHOWN : HIDDEN, changes),
  ).join("\n");
}

function positionPercent(time: number) {
  return (time / DURATION) * 100;
}

function playheadKeyframes() {
  const initial = positionPercent(INITIAL_TIME);
  const seeked = positionPercent(SEEK_TIME);
  const stops: [number, number][] = [
    [0, initial],
    [SEEK - SWITCH, initial],
    [SEEK, seeked],
    [PLAY_CLICK, seeked],
    [END, 100],
    [RESET, 100],
    [RESET + FADE, initial],
    [100, initial],
  ];
  return [
    keyframes(
      "abr-player-fill",
      stops.map(([at, value]) => [at, `width: ${value}%;`]),
      "linear",
    ),
    keyframes(
      "abr-player-head",
      stops.map(([at, value]) => [at, `left: ${value}%;`]),
      "linear",
    ),
  ].join("\n");
}

function point({ x, y }: Point) {
  return `left: ${x}%; top: ${y}%;`;
}

function replayCursorKeyframes() {
  return keyframes(
    "abr-player-replay-cursor",
    [
      [0, point(INPUT_POINT)],
      [SEEK - SWITCH, point(INPUT_POINT)],
      [SEEK, point(SAVE_POINT)],
      [playAt(48), point(SAVE_POINT)],
      [playAt(52), point(DRIFT_POINT)],
      [playAt(56.5), point(SAVE_POINT)],
      [RESET, point(SAVE_POINT)],
      [RESET + FADE, point(INPUT_POINT)],
      [100, point(INPUT_POINT)],
    ],
    "ease-in-out",
  );
}

function cursorKeyframes() {
  return keyframes(
    "abr-player-cursor",
    CURSOR_PATH.map(({ at, x, y }) => [at, point({ x, y })]),
    "ease-in-out",
  );
}

const RIPPLES = [
  ...CLICKS.map(({ at, x, y }) => ({ at, x, y })),
  // The Reviewer's own click on "Save changes", replayed once playback runs.
  { at: PLAY_CLICK + 1, ...SAVE_POINT },
];

function rippleKeyframes() {
  return RIPPLES.map(
    ({ at }, i) => `@keyframes abr-player-ripple-${i} {
  0%, ${at - 0.5}% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
  ${at}% { opacity: 1; transform: translate(-50%, -50%) scale(0.3); }
  ${at + 6}%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(1.6); }
}
.abr-player-ripple-${i} { opacity: 0; animation: abr-player-ripple-${i} ${CYCLE}s ease-out infinite; }`,
  ).join("\n");
}

const styles = `
${logKeyframes()}
${timecodeKeyframes()}
${playheadKeyframes()}
${replayCursorKeyframes()}
${cursorKeyframes()}
${rippleKeyframes()}
${stepped("abr-player-play", SHOWN, [
  [PLAY_CLICK, HIDDEN],
  [END, SHOWN],
])}
${stepped("abr-player-pause", HIDDEN, [
  [PLAY_CLICK, SHOWN],
  [END, HIDDEN],
])}
${stepped("abr-player-speed-1", SHOWN, [
  [SPEED_CLICK, HIDDEN],
  [RESET, SHOWN],
])}
${stepped("abr-player-speed-2", HIDDEN, [
  [SPEED_CLICK, SHOWN],
  [RESET, HIDDEN],
])}
${stepped("abr-player-toast", HIDDEN, [
  [playAt(47), SHOWN],
  [RESET, HIDDEN],
])}
${stepped("abr-player-selection", HIDDEN, [
  [END, SHOWN],
  [RESET, HIDDEN],
])}

@media (prefers-reduced-motion: reduce) {
  ${frozenRules.join("\n  ")}
  ${RIPPLES.map((_, i) => `.abr-player-ripple-${i}`).join(", ")} { animation: none; opacity: 0; }
  .abr-player-cursor { animation: none; ${point(REST_POINT)} }
}
`;

export function InboxPlayerAnimation() {
  return (
    <div
      role="img"
      aria-label={ARIA_LABEL}
      className="@container aspect-[16/10] w-full"
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="grid h-full">
        <TerminalFrame
          title="Feedback #24 · Recording"
          contentClassName="relative min-h-0 flex-1"
        >
          <div className="absolute inset-0 flex font-mono text-[8px] leading-none @[24rem]:text-[9px] @[36rem]:text-[11px]">
            <div
              className="flex h-full min-w-0 flex-col"
              style={{ width: `${PLAYER_WIDTH}%` }}
            >
              <div
                className="relative overflow-hidden bg-zinc-950"
                style={{ height: `${100 - CONTROLS_HEIGHT}%` }}
              >
                <ReplayPage />
              </div>
              <Controls />
            </div>
            <Log />

            {CLICKS.map(({ x, y }, i) => (
              <span
                key={`${x}-${y}`}
                className={`abr-player-ripple-${i} absolute size-5 rounded-full border-2 border-indigo-400/80`}
                style={{ left: `${x}%`, top: `${y}%` }}
              />
            ))}
            <MousePointer2Icon className="abr-player-cursor absolute z-10 size-4 fill-zinc-100 text-zinc-900" />
          </div>
        </TerminalFrame>
      </div>
    </div>
  );
}

function ReplayPage() {
  return (
    <>
      {/* Navigation */}
      <div className="absolute inset-x-0 top-0 flex h-[12%] items-center gap-[4%] border-b border-zinc-800 px-[6%]">
        <span className="h-[30%] w-[14%] rounded-[2px] bg-zinc-700" />
        <span className="ml-auto h-[22%] w-[10%] rounded-[2px] bg-zinc-800" />
        <span className="h-[22%] w-[10%] rounded-[2px] bg-zinc-800" />
      </div>

      {/* Settings form */}
      <span className="absolute top-[20%] left-[8%] h-[5%] w-[30%] rounded-[2px] bg-zinc-700" />
      <span className="absolute top-[33%] left-[8%] h-[3%] w-[20%] rounded-[2px] bg-zinc-800" />
      <span className="absolute top-[38%] left-[8%] h-[9%] w-[70%] rounded-[3px] border border-zinc-800 bg-zinc-900" />
      <span className="absolute top-[51%] left-[8%] h-[3%] w-[14%] rounded-[2px] bg-zinc-800" />
      <span className="absolute top-[56%] left-[8%] h-[9%] w-[70%] rounded-[3px] border border-zinc-800 bg-zinc-900" />
      <span
        className="absolute flex items-center justify-center rounded-[3px] bg-zinc-200 font-sans font-medium whitespace-nowrap text-zinc-900"
        style={{
          left: `${SAVE_BUTTON.x}%`,
          top: `${SAVE_BUTTON.y}%`,
          width: `${SAVE_BUTTON.width}%`,
          height: `${SAVE_BUTTON.height}%`,
        }}
      >
        Save changes
      </span>

      <span
        className="abr-player-selection absolute rounded-[5px] border-2 border-dashed border-indigo-400/90 bg-indigo-400/10"
        style={{
          left: `${SAVE_BUTTON.x - 2}%`,
          top: `${SAVE_BUTTON.y - 4}%`,
          width: `${SAVE_BUTTON.width + 4}%`,
          height: `${SAVE_BUTTON.height + 8}%`,
        }}
      />

      <span className="abr-player-toast absolute right-[5%] bottom-[5%] flex items-center gap-1.5 rounded-[4px] border border-zinc-700 bg-zinc-900 px-2 py-1.5 font-sans text-zinc-200 shadow-lg">
        <span className="size-1.5 shrink-0 rounded-full bg-red-400" />
        Save failed
      </span>

      <span
        className={`abr-player-ripple-${CLICKS.length} absolute size-4 rounded-full border-2 border-zinc-300/70`}
        style={{ left: `${SAVE_POINT.x}%`, top: `${SAVE_POINT.y}%` }}
      />
      <MousePointer2Icon className="abr-player-replay-cursor absolute size-3 fill-zinc-400 text-zinc-900" />
    </>
  );
}

function Controls() {
  return (
    <div
      className="flex items-center border-t border-zinc-800"
      style={{
        height: `${CONTROLS_HEIGHT}%`,
        paddingInline: `${BAR_PADDING}%`,
      }}
    >
      <span
        className="relative flex h-full shrink-0 items-center justify-center"
        style={{ width: `${PLAY_WIDTH}%` }}
      >
        <PlayIcon className="abr-player-play absolute size-3 fill-zinc-200 text-zinc-200" />
        <PauseIcon className="abr-player-pause absolute size-3 fill-zinc-200 text-zinc-200" />
      </span>

      <span className="ml-[2%] flex shrink-0 text-zinc-200 tabular-nums">
        <span className="inline-grid">
          {TIMECODES.map(({ label }, i) => (
            <span
              key={label}
              className={`abr-player-time-${i} [grid-area:1/1]`}
            >
              {label}
            </span>
          ))}
        </span>
        <span className="hidden text-zinc-500 @[30rem]:inline">
          &nbsp;/ {formatTimecode(DURATION)}
        </span>
      </span>

      <Scrubber />

      <span
        className="flex h-full shrink-0"
        style={{ width: `${SPEED_WIDTH * SPEEDS.length}%` }}
      >
        {SPEEDS.map((rate) => (
          <span
            key={rate}
            className="relative flex h-full flex-1 items-center justify-center text-zinc-500 tabular-nums"
          >
            {rate}x
            {rate !== 4 && (
              <span
                className={`abr-player-speed-${rate} absolute inset-x-[8%] inset-y-[22%] flex items-center justify-center rounded-[3px] bg-zinc-800 text-zinc-100`}
              >
                {rate}x
              </span>
            )}
          </span>
        ))}
      </span>
    </div>
  );
}

const TICK_CLASS = {
  step: "bg-zinc-600",
  error: "bg-red-400/80",
  selection: "bg-indigo-400",
} as const;

function Scrubber() {
  return (
    <span className="relative mx-[4%] h-1 min-w-0 flex-1 rounded-full bg-zinc-800">
      <span className="abr-player-fill absolute inset-y-0 left-0 rounded-full bg-zinc-500" />
      {LOG.map(({ time, tone }) => (
        <span
          key={time}
          className={`absolute top-1/2 h-2 w-px -translate-y-1/2 ${TICK_CLASS[tone ?? "step"]}`}
          style={{ left: `${positionPercent(time)}%` }}
        />
      ))}
      <span className="abr-player-head absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-100" />
    </span>
  );
}

function Log() {
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col border-l border-zinc-800">
      <div
        className="flex shrink-0 items-center gap-[3%] border-b border-zinc-800 px-[4%]"
        style={{ height: `${FILTERS_HEIGHT}%` }}
      >
        {SOURCES.map((source) => (
          <span
            key={source}
            className="rounded-[3px] bg-zinc-800 px-[5%] py-[3%] font-sans text-zinc-200"
          >
            {source}
          </span>
        ))}
      </div>
      {LOG.map(({ time, content }, i) => (
        <div
          key={time}
          className="relative flex shrink-0 items-center"
          style={{ height: `${ROW_HEIGHT}%` }}
        >
          <span
            className={`abr-player-current-${i} absolute inset-0 border-l-2 border-indigo-400 bg-zinc-800/70`}
          />
          <span
            className={`abr-player-ahead-${i} relative flex w-full min-w-0 items-center gap-[4%] px-[5%]`}
          >
            <span className="w-[26%] shrink-0 text-right text-zinc-500 tabular-nums">
              {(time - DURATION).toFixed(1)} s
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-[5%]">
              {content}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

type StepLineProps = {
  text: string;
};

function StepLine({ text }: StepLineProps) {
  return <span className="min-w-0 truncate text-zinc-300">{text}</span>;
}
