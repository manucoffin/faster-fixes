import { TerminalFrame } from "@/app/(public)/(home)/_features/how-it-works/flow-animations";
import { MousePointer2Icon, PlayIcon } from "lucide-react";

const CYCLE = 14;

// Percentages of the cycle.
const PLAY_START = 3;
const CLICK_FIELD = 13;
const TYPE_START = 15;
const TYPE_END = 25;
const SCROLL_START = 32;
const SCROLL_END = 42;
const CLICK_SAVE = 48;
const POST = 50;
const ERROR = 54;
const SELECT = 72;
const RESET = 95;

// Length of a fade in or out, in percentages of the cycle.
const FADE = 2;

// Seconds before the Selection, matching the Timeline on the same page.
const RECORDING_SECONDS = 58;
const SECONDS = {
  clickField: 40,
  scrollStart: 24,
  scrollEnd: 18,
  clickSave: 12.4,
  post: 12.0,
  error: 11.0,
} as const;

// The page is taller than the viewport and scrolls by SCROLL_DISTANCE, both
// as percentages of the viewport height. Page elements are placed in
// percentages of the page, the cursor in percentages of the viewport.
const PAGE_HEIGHT = 150;
const SCROLL_DISTANCE = 45;
const SCROLL_SHIFT = (SCROLL_DISTANCE / PAGE_HEIGHT) * 100;
const THUMB_HEIGHT = (100 / PAGE_HEIGHT) * 100;

const FIELD = { left: 32, top: 20, width: 40, height: 6 };
const SAVE_BUTTON = { left: 32, top: 80, width: 22, height: 7 };

function pageToViewportY(y: number, scrolled: boolean) {
  return (y * PAGE_HEIGHT) / 100 - (scrolled ? SCROLL_DISTANCE : 0);
}

const REST_POINT = { x: 84, y: 14 };
const FIELD_POINT = {
  x: FIELD.left + 8,
  y: pageToViewportY(FIELD.top + FIELD.height / 2, false),
};
const SCROLL_POINT = { x: 66, y: 58 };
const SAVE_POINT = {
  x: SAVE_BUTTON.left + SAVE_BUTTON.width / 2,
  y: pageToViewportY(SAVE_BUTTON.top + SAVE_BUTTON.height / 2, true),
};
const TOAST_POINT = { x: 72, y: 30 };

// Cursor stops, as percentages of the viewport. A stop with `click` shows a
// ripple on arrival.
const CURSOR_PATH = [
  { at: 0, ...REST_POINT, click: false },
  { at: PLAY_START, ...REST_POINT, click: false },
  { at: 8, x: 62, y: 24, click: false },
  { at: CLICK_FIELD - 1, ...FIELD_POINT, click: false },
  { at: CLICK_FIELD, ...FIELD_POINT, click: true },
  { at: TYPE_END + 1, ...FIELD_POINT, click: false },
  { at: SCROLL_START, ...SCROLL_POINT, click: false },
  { at: SCROLL_END, ...SCROLL_POINT, click: false },
  { at: CLICK_SAVE - 2, ...SAVE_POINT, click: false },
  { at: CLICK_SAVE, ...SAVE_POINT, click: true },
  { at: ERROR + 2, ...SAVE_POINT, click: false },
  { at: 61, ...TOAST_POINT, click: false },
  { at: SELECT - 2, ...SAVE_POINT, click: false },
  { at: SELECT, ...SAVE_POINT, click: true },
  { at: 100, ...SAVE_POINT, click: false },
] as const;

const CLICKS = CURSOR_PATH.filter(({ click }) => click);

// Seconds of the Recording reached at each point of the cycle: the replay
// skips through the idle stretches, so the playhead speeds up between events.
const PLAYHEAD_PATH = [
  { at: 0, seconds: RECORDING_SECONDS },
  { at: PLAY_START, seconds: RECORDING_SECONDS },
  { at: CLICK_FIELD, seconds: SECONDS.clickField },
  { at: SCROLL_START, seconds: SECONDS.scrollStart },
  { at: SCROLL_END, seconds: SECONDS.scrollEnd },
  { at: CLICK_SAVE, seconds: SECONDS.clickSave },
  { at: ERROR, seconds: SECONDS.error },
  { at: SELECT, seconds: 0 },
  { at: 100, seconds: 0 },
] as const;

function scrubberPosition(seconds: number) {
  return ((RECORDING_SECONDS - seconds) / RECORDING_SECONDS) * 100;
}

const TICKS = [
  { key: "click-field", seconds: SECONDS.clickField, error: false },
  { key: "click-save", seconds: SECONDS.clickSave, error: false },
  { key: "post", seconds: SECONDS.post, error: true },
] as const;

const MASKED_CHARS = Array.from({ length: 8 }, (_, i) => ({
  key: `char-${i}`,
  at: TYPE_START + ((TYPE_END - TYPE_START) * i) / 8,
}));

// Seconds each trail dot lags behind the cursor.
const TRAIL_DELAYS = [0.06, 0.12, 0.18, 0.24];

const ARIA_LABEL =
  "Animation showing a Recording replaying the last minute on a settings page: the pointer moves with a trail, clicks a field where the typed value shows as asterisks only, scrolls down and clicks Save changes, a Save failed message appears, then the replay ends on the Selection of that button. A scrubber runs from 58 seconds before to the Selection marker. The widget caption reads: Includes the last minute on this page.";

const HIDDEN = "opacity: 0; transform: translateY(3px);";
const SHOWN = "opacity: 1; transform: none;";

// Classes that end the cycle shown, so the reduced-motion block can freeze
// each on its final state.
const enterClasses: string[] = [];

// Shown from `at` to the end of the cycle: the veil hides the jump back.
function enter(name: string, at: number, hidden = HIDDEN) {
  enterClasses.push(name);
  return `@keyframes ${name} {
  0%, ${at}% { ${hidden} }
  ${at + FADE}%, 100% { ${SHOWN} }
}
.${name} { opacity: 0; animation: ${name} ${CYCLE}s ease-out infinite; }`;
}

function cursorKeyframes() {
  const stops = CURSOR_PATH.map(
    ({ at, x, y }) => `${at}% { left: ${x}%; top: ${y}%; }`,
  ).join("\n  ");
  return `@keyframes abr-replay-cursor {\n  ${stops}\n}
.abr-replay-cursor { animation: abr-replay-cursor ${CYCLE}s ease-in-out infinite; }
.abr-replay-trail { left: ${REST_POINT.x}%; top: ${REST_POINT.y}%; animation: abr-replay-cursor ${CYCLE}s ease-in-out infinite backwards; }`;
}

function rippleKeyframes() {
  return CLICKS.map(
    ({ at }, i) => `@keyframes abr-replay-ripple-${i} {
  0%, ${at - 0.5}% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
  ${at}% { opacity: 1; transform: translate(-50%, -50%) scale(0.3); }
  ${at + 5}%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(1.6); }
}
.abr-replay-ripple-${i} { opacity: 0; animation: abr-replay-ripple-${i} ${CYCLE}s ease-out infinite; }`,
  ).join("\n");
}

function playheadKeyframes() {
  const stops = (property: string) =>
    PLAYHEAD_PATH.map(
      ({ at, seconds }) =>
        `${at}% { ${property}: ${scrubberPosition(seconds).toFixed(2)}%; }`,
    ).join("\n  ");
  return `@keyframes abr-replay-playhead {\n  ${stops("left")}\n}
@keyframes abr-replay-progress {\n  ${stops("width")}\n}
.abr-replay-playhead { left: 0; animation: abr-replay-playhead ${CYCLE}s linear infinite; }
.abr-replay-progress { width: 0; animation: abr-replay-progress ${CYCLE}s linear infinite; }`;
}

function typingKeyframes() {
  return MASKED_CHARS.map(
    ({ at }, i) =>
      `@keyframes abr-replay-char-${i} { 0% { opacity: 0; } ${at.toFixed(2)}%, 100% { opacity: 1; } }
.abr-replay-char-${i} { opacity: 0; animation: abr-replay-char-${i} ${CYCLE}s step-end infinite; }`,
  ).join("\n");
}

const styles = `
${cursorKeyframes()}
${rippleKeyframes()}
${playheadKeyframes()}
${typingKeyframes()}
${enter("abr-replay-focus", CLICK_FIELD, "opacity: 0;")}
${enter("abr-replay-toast", ERROR, "opacity: 0; transform: translateY(-4px);")}
${enter("abr-replay-selection", SELECT, "opacity: 0; transform: scale(1.04);")}
${enter("abr-replay-selected-tick", SELECT, "opacity: 0; transform: scale(0.4);")}

@keyframes abr-replay-scroll {
  0%, ${SCROLL_START}% { transform: translateY(0); }
  ${SCROLL_END}%, 100% { transform: translateY(-${SCROLL_SHIFT}%); }
}

@keyframes abr-replay-thumb {
  0%, ${SCROLL_START}% { transform: translateY(0); }
  ${SCROLL_END}%, 100% { transform: translateY(${(SCROLL_SHIFT / THUMB_HEIGHT) * 100}%); }
}

@keyframes abr-replay-press {
  0%, ${CLICK_SAVE - 0.5}% { transform: scale(1); }
  ${CLICK_SAVE}% { transform: scale(0.92); }
  ${CLICK_SAVE + 1.5}%, 100% { transform: scale(1); }
}

@keyframes abr-replay-saving {
  0%, ${CLICK_SAVE}% { opacity: 0; }
  ${CLICK_SAVE + 0.5}%, ${POST + 2}% { opacity: 1; }
  ${ERROR}%, 100% { opacity: 0; }
}

@keyframes abr-replay-veil {
  0% { opacity: 1; }
  ${FADE}%, ${RESET}% { opacity: 0; }
  ${RESET + 3}%, 100% { opacity: 1; }
}

.abr-replay-scroll { animation: abr-replay-scroll ${CYCLE}s ease-in-out infinite; }
.abr-replay-thumb { animation: abr-replay-thumb ${CYCLE}s ease-in-out infinite; }
.abr-replay-press { animation: abr-replay-press ${CYCLE}s ease-out infinite; }
.abr-replay-saving { opacity: 0; animation: abr-replay-saving ${CYCLE}s ease-out infinite; }
.abr-replay-veil { animation: abr-replay-veil ${CYCLE}s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .abr-replay-cursor { animation: none; left: ${SAVE_POINT.x}%; top: ${SAVE_POINT.y}%; }
  .abr-replay-scroll { animation: none; transform: translateY(-${SCROLL_SHIFT}%); }
  .abr-replay-thumb { animation: none; transform: translateY(${(SCROLL_SHIFT / THUMB_HEIGHT) * 100}%); }
  .abr-replay-playhead { animation: none; left: 100%; }
  .abr-replay-progress { animation: none; width: 100%; }
  ${enterClasses.map((name) => `.${name}`).join(", ")} { animation: none; opacity: 1; transform: none; }
  ${MASKED_CHARS.map((_, i) => `.abr-replay-char-${i}`).join(", ")} { animation: none; opacity: 1; }
  ${CLICKS.map((_, i) => `.abr-replay-ripple-${i}`).join(", ")}, .abr-replay-trail, .abr-replay-saving, .abr-replay-veil { animation: none; opacity: 0; }
  .abr-replay-press { animation: none; }
}
`;

export function RecordingReplayAnimation() {
  return (
    <div
      role="img"
      aria-label={ARIA_LABEL}
      className="@container flex aspect-[16/10] w-full flex-col gap-2"
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="grid min-h-0 flex-1">
        <TerminalFrame
          title="Recording · yourapp.com/settings"
          contentClassName="flex min-h-0 flex-1 flex-col"
        >
          <ReplayViewport />
          <Scrubber />
        </TerminalFrame>
      </div>
      <WidgetCaption />
    </div>
  );
}

function ReplayViewport() {
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-zinc-950">
      <div
        className="abr-replay-scroll absolute inset-x-0 top-0"
        style={{ height: `${PAGE_HEIGHT}%` }}
      >
        <SettingsPage />
      </div>

      {/* The site's own toast, part of the reconstructed page */}
      <div className="abr-replay-toast absolute top-[6%] right-[4%] flex items-center gap-1.5 rounded-md border border-red-500/30 bg-zinc-900 px-2 py-1 font-mono text-[9px] leading-3 text-red-300 shadow-lg @md:text-[10px]">
        <span className="size-1.5 shrink-0 rounded-full bg-red-400" />
        Save failed
      </div>

      {/* Scrollbar */}
      <div className="absolute top-[3%] right-[1%] bottom-[3%] w-1 rounded-full bg-zinc-900">
        <span
          className="abr-replay-thumb absolute inset-x-0 top-0 rounded-full bg-zinc-700"
          style={{ height: `${THUMB_HEIGHT}%` }}
        />
      </div>

      {CLICKS.map(({ x, y, at }, i) => (
        <span
          key={at}
          className={`abr-replay-ripple-${i} absolute mt-[3px] ml-[3px] size-5 rounded-full border-2 border-zinc-300/80`}
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      ))}

      {TRAIL_DELAYS.map((delay, i) => (
        <span
          key={delay}
          className="abr-replay-trail absolute mt-[3px] ml-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-300"
          style={{
            animationDelay: `${delay}s`,
            width: `${5 - i}px`,
            height: `${5 - i}px`,
            opacity: 0.45 - i * 0.1,
          }}
        />
      ))}

      <MousePointer2Icon className="abr-replay-cursor absolute size-4 fill-zinc-100 text-zinc-900" />

      <div className="abr-replay-veil absolute inset-0 bg-zinc-950" />
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="absolute inset-0">
      {/* Navigation */}
      <div className="absolute inset-x-0 top-0 flex h-[6%] items-center gap-[3%] border-b border-zinc-800 px-[6%]">
        <span className="h-[30%] w-[10%] rounded-[2px] bg-zinc-700" />
        <span className="ml-auto h-[22%] w-[8%] rounded-[2px] bg-zinc-800" />
        <span className="aspect-square h-[45%] rounded-full bg-zinc-700" />
      </div>

      {/* Sidebar */}
      {[11, 16, 21, 26].map((top, i) => (
        <span
          key={top}
          className={`absolute left-[6%] h-[2.6%] w-[16%] rounded-[2px] ${i === 1 ? "bg-zinc-800" : "bg-zinc-900"}`}
          style={{ top: `${top}%` }}
        />
      ))}

      {/* Heading */}
      <span className="absolute top-[10%] left-[32%] h-[2.6%] w-[18%] rounded-[2px] bg-zinc-700" />

      {/* Display name, focused and typed in */}
      <span className="absolute top-[17%] left-[32%] h-[1.4%] w-[10%] rounded-[1px] bg-zinc-800" />
      <div
        className="absolute flex items-center rounded-[3px] border border-zinc-800 bg-zinc-900 px-[1%]"
        style={{
          left: `${FIELD.left}%`,
          top: `${FIELD.top}%`,
          width: `${FIELD.width}%`,
          height: `${FIELD.height}%`,
        }}
      >
        <span className="abr-replay-focus absolute -inset-px rounded-[3px] border border-zinc-500" />
        <span className="relative font-mono text-[9px] leading-none text-zinc-400 @md:text-[11px]">
          {MASKED_CHARS.map(({ key }, i) => (
            <span key={key} className={`abr-replay-char-${i}`}>
              *
            </span>
          ))}
        </span>
      </div>

      {/* Email */}
      <span className="absolute top-[30%] left-[32%] h-[1.4%] w-[8%] rounded-[1px] bg-zinc-800" />
      <div className="absolute top-[33%] left-[32%] flex h-[6%] w-[40%] items-center rounded-[3px] border border-zinc-800 bg-zinc-900 px-[1.5%]">
        <span className="h-[22%] w-[55%] rounded-[1px] bg-zinc-700" />
      </div>

      {/* Bio */}
      <span className="absolute top-[43%] left-[32%] h-[1.4%] w-[6%] rounded-[1px] bg-zinc-800" />
      <div className="absolute top-[46%] left-[32%] flex h-[14%] w-[54%] flex-col gap-[8%] rounded-[3px] border border-zinc-800 bg-zinc-900 p-[1.5%]">
        <span className="h-[10%] w-[85%] rounded-[1px] bg-zinc-800" />
        <span className="h-[10%] w-[70%] rounded-[1px] bg-zinc-800" />
        <span className="h-[10%] w-[40%] rounded-[1px] bg-zinc-800" />
      </div>

      {/* Notifications toggle */}
      <span className="absolute top-[65%] left-[32%] h-[3%] w-[5%] rounded-full bg-zinc-700" />
      <span className="absolute top-[65.9%] left-[39%] h-[1.4%] w-[18%] rounded-[1px] bg-zinc-800" />

      <span className="absolute top-[75%] right-[6%] left-[32%] h-px bg-zinc-800" />

      <SaveButton />
      <span className="absolute top-[80%] left-[56%] flex h-[7%] w-[10%] items-center justify-center rounded-[3px] border border-zinc-800">
        <span className="h-[18%] w-[55%] rounded-[1px] bg-zinc-800" />
      </span>

      {/* Footer */}
      <span className="absolute inset-x-0 top-[94%] h-px bg-zinc-900" />
    </div>
  );
}

function selectionFrame() {
  return {
    left: `${SAVE_BUTTON.left - 1}%`,
    top: `${SAVE_BUTTON.top - 1.2}%`,
    width: `${SAVE_BUTTON.width + 2}%`,
    height: `${SAVE_BUTTON.height + 2.4}%`,
  };
}

function SaveButton() {
  const frame = {
    left: `${SAVE_BUTTON.left}%`,
    top: `${SAVE_BUTTON.top}%`,
    width: `${SAVE_BUTTON.width}%`,
    height: `${SAVE_BUTTON.height}%`,
  };

  return (
    <>
      <span
        className="abr-replay-press absolute flex items-center justify-center rounded-[3px] bg-zinc-200 text-[8px] leading-none font-medium whitespace-nowrap text-zinc-900 @md:text-[10px]"
        style={frame}
      >
        Save changes
        <span className="abr-replay-saving absolute inset-0 rounded-[3px] bg-zinc-950/30" />
      </span>

      {/* Selection frame, drawn over the last instant of the Recording */}
      <span
        className="abr-replay-selection absolute rounded-[5px] border-2 border-dashed border-indigo-400/90 bg-indigo-400/10"
        style={selectionFrame()}
      >
        <span className="absolute bottom-full left-0 mb-0.5 font-mono text-[8px] leading-none whitespace-nowrap text-indigo-300 @md:text-[9px]">
          button#save
        </span>
      </span>
    </>
  );
}

function Scrubber() {
  return (
    <div className="flex shrink-0 items-center gap-2 border-t border-zinc-800 px-3 py-1.5 font-mono text-[9px] leading-3 text-zinc-500 @md:text-[10px]">
      <PlayIcon className="size-2.5 shrink-0 fill-zinc-400 text-zinc-400" />
      <span className="shrink-0 tabular-nums">-58 s</span>
      <div className="relative h-3 min-w-0 flex-1">
        <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-zinc-800" />
        <span className="abr-replay-progress absolute top-1/2 left-0 h-0.5 -translate-y-1/2 rounded-full bg-zinc-500" />
        <span
          className="absolute top-1/2 h-1 -translate-y-1/2 bg-zinc-600"
          style={{
            left: `${scrubberPosition(SECONDS.scrollStart)}%`,
            width: `${scrubberPosition(SECONDS.scrollEnd) - scrubberPosition(SECONDS.scrollStart)}%`,
          }}
        />
        {TICKS.map(({ key, seconds, error }) => (
          <span
            key={key}
            className={`absolute top-1/2 h-2 w-px -translate-x-1/2 -translate-y-1/2 ${error ? "bg-red-400" : "bg-zinc-400"}`}
            style={{ left: `${scrubberPosition(seconds)}%` }}
          />
        ))}
        {/* Selection marker */}
        <span className="absolute top-1/2 left-full size-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-indigo-400" />
        <span className="abr-replay-selected-tick absolute top-1/2 left-full size-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-indigo-400" />
        <span className="abr-replay-playhead absolute top-1/2 h-2.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-100" />
      </div>
      <span className="shrink-0 text-indigo-300">Selection</span>
    </div>
  );
}

function WidgetCaption() {
  return (
    <div className="flex shrink-0 justify-end">
      <div className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] leading-3 text-zinc-400">
        <span className="size-1.5 shrink-0 rounded-full bg-red-400" />
        Includes the last minute on this page.
      </div>
    </div>
  );
}
