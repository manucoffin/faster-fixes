import { TerminalFrame } from "@/app/(public)/(home)/_features/how-it-works/flow-animations";
import {
  CheckIcon,
  MessageSquarePlusIcon,
  MousePointer2Icon,
} from "lucide-react";

const CYCLE = 12;

// Percentages of the cycle. Beat 1: the review link loads the page and the
// Widget. Beat 2: annotation mode and the Selection. Beat 3: the comment.
const LOAD_START = 2;
const LOAD_END = 12;
const WIDGET_IN = 15;
const LAUNCHER_HOVER = 22;
const LAUNCHER_CLICK = 25;
const ELEMENT_HOVER = 32;
const ELEMENT_CLICK = 36;
const PANEL_OPEN = 39;
const TYPE_START = 42;
const TYPE_END = 60;
const SUBMIT = 66;
const REST = 74;
const RESET = 94;

// Length of a fade in or out, in percentages of the cycle.
const FADE = 2;

const STEPS = [
  { label: "Open review link", from: 0, to: LAUNCHER_HOVER - FADE },
  { label: "Select", from: LAUNCHER_HOVER - FADE, to: PANEL_OPEN - FADE },
  { label: "Comment", from: PANEL_OPEN - FADE, to: RESET },
] as const;

const COMMENT = "The second button sits 6px lower than the first.";

// Hero buttons, as percentages of the mock page. The second one sits lower
// than its neighbour: it is the misalignment the Reviewer selects.
const BUTTON = { width: 15, height: 9 };
const BUTTONS = [
  { x: 7, y: 60 },
  { x: 24, y: 63 },
] as const;
const MISALIGNED = BUTTONS[1];

// The comment panel, as percentages of the mock page.
const PANEL = { x: 54, y: 15, width: 42, height: 70 };

// Cursor stops, as percentages of the mock page. A stop with `click` shows a
// ripple on arrival.
const REST_POINT = { x: 46, y: 30 };
const LAUNCHER_POINT = { x: 92, y: 89 };
const ELEMENT_POINT = { x: 32, y: 67 };
const SUBMIT_POINT = {
  x: PANEL.x + PANEL.width - 9,
  y: PANEL.y + PANEL.height - 10,
};

const CURSOR_PATH = [
  { at: 0, ...REST_POINT, click: false },
  { at: WIDGET_IN, ...REST_POINT, click: false },
  { at: LAUNCHER_HOVER, ...LAUNCHER_POINT, click: false },
  { at: LAUNCHER_CLICK, ...LAUNCHER_POINT, click: true },
  { at: ELEMENT_HOVER, ...ELEMENT_POINT, click: false },
  { at: ELEMENT_CLICK, ...ELEMENT_POINT, click: true },
  { at: TYPE_END, ...ELEMENT_POINT, click: false },
  { at: SUBMIT - 2, ...SUBMIT_POINT, click: false },
  { at: SUBMIT, ...SUBMIT_POINT, click: true },
  { at: SUBMIT + 3, ...SUBMIT_POINT, click: false },
  { at: REST, ...REST_POINT, click: false },
  { at: 100, ...REST_POINT, click: false },
] as const;

const CLICKS = CURSOR_PATH.filter(({ click }) => click);

const ARIA_LABEL =
  "Animation in three steps on a live site. A review link opens the page and the Widget appears, with no sign-up screen and no extension prompt. The Reviewer turns on annotation mode and selects a button that sits lower than its neighbour. They type one sentence and submit it: the Feedback is sent and a Pin marks the element.";

const HIDDEN = "opacity: 0; transform: translateY(4px);";
const SHOWN = "opacity: 1; transform: none;";

// Classes that end the cycle shown, and those that end it hidden, so the
// reduced-motion block can freeze each on its final state.
const enterClasses: string[] = [];
const leaveClasses: string[] = [];

// Shown from `at` until the reset.
function enter(name: string, at: number, hidden = HIDDEN) {
  enterClasses.push(name);
  return `@keyframes ${name} {
  0%, ${at}% { ${hidden} }
  ${at + FADE}%, ${RESET}% { ${SHOWN} }
  ${RESET + FADE}%, 100% { ${hidden} }
}
.${name} { opacity: 0; animation: ${name} ${CYCLE}s ease-out infinite; }`;
}

// Hidden from `at` until the reset.
function leave(name: string, at: number) {
  leaveClasses.push(name);
  return `@keyframes ${name} {
  0%, ${at}% { opacity: 1; }
  ${at + FADE}%, ${RESET}% { opacity: 0; }
  ${RESET + FADE}%, 100% { opacity: 1; }
}
.${name} { animation: ${name} ${CYCLE}s ease-out infinite; }`;
}

// Shown from `from` to `to` only; ends the cycle hidden.
function during(name: string, from: number, to: number) {
  leaveClasses.push(name);
  const fadeIn =
    from === 0 ? "0%" : `0%, ${from}% { opacity: 0; }\n  ${from + FADE}%`;
  return `@keyframes ${name} {
  ${fadeIn}, ${to}% { opacity: 1; }
  ${to + FADE}%, 100% { opacity: 0; }
}
.${name} { opacity: 0; animation: ${name} ${CYCLE}s ease-out infinite; }`;
}

function stepKeyframes() {
  return STEPS.map(({ from, to }, i) =>
    i === STEPS.length - 1
      ? enter(`abr-create-step-${i}`, from, "opacity: 0;")
      : during(`abr-create-step-${i}`, from, to),
  ).join("\n");
}

function cursorKeyframes() {
  const stops = CURSOR_PATH.map(
    ({ at, x, y }) => `${at}% { left: ${x}%; top: ${y}%; }`,
  ).join("\n  ");
  return `@keyframes abr-create-cursor {\n  ${stops}\n}
.abr-create-cursor { animation: abr-create-cursor ${CYCLE}s ease-in-out infinite; }`;
}

function rippleKeyframes() {
  return CLICKS.map(
    ({ at }, i) => `@keyframes abr-create-ripple-${i} {
  0%, ${at - 0.5}% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
  ${at}% { opacity: 1; transform: translate(-50%, -50%) scale(0.3); }
  ${at + 6}%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(1.6); }
}
.abr-create-ripple-${i} { opacity: 0; animation: abr-create-ripple-${i} ${CYCLE}s ease-out infinite; }`,
  ).join("\n");
}

const COMMENT_CHARS = Array.from(COMMENT, (char, i) => ({
  char,
  key: `${i}-${char}`,
  at: TYPE_START + ((TYPE_END - TYPE_START) * i) / COMMENT.length,
}));

// One keyframe per character: a shared keyframe with staggered delays would
// leave early characters showing when the next cycle opens the panel.
function typingKeyframes() {
  return COMMENT_CHARS.map(
    ({ at }, i) =>
      `@keyframes abr-create-char-${i} { 0% { opacity: 0; } ${at.toFixed(2)}%, 100% { opacity: 1; } }
.abr-create-char-${i} { animation: abr-create-char-${i} ${CYCLE}s step-end infinite; }`,
  ).join("\n");
}

const styles = `
${stepKeyframes()}
${cursorKeyframes()}
${rippleKeyframes()}
${typingKeyframes()}
${enter("abr-create-page", LOAD_END, "opacity: 0;")}
${enter("abr-create-widget", WIDGET_IN, "opacity: 0; transform: scale(0.6);")}
${enter("abr-create-selected", ELEMENT_CLICK, "opacity: 0;")}
${enter("abr-create-panel", PANEL_OPEN, "opacity: 0; transform: translateX(6px);")}
${enter("abr-create-sent", SUBMIT, "opacity: 0; transform: scale(0.6);")}
${enter("abr-create-pin", SUBMIT + FADE, "opacity: 0; transform: scale(0.5);")}
${leave("abr-create-skeleton", LOAD_END)}
${leave("abr-create-submit", SUBMIT)}
${during("abr-create-mode", LAUNCHER_CLICK, ELEMENT_CLICK)}
${during("abr-create-hover", ELEMENT_HOVER - FADE, ELEMENT_CLICK - 1)}

@keyframes abr-create-load {
  0%, ${LOAD_START}% { opacity: 1; width: 0%; }
  ${LOAD_END}% { opacity: 1; width: 100%; }
  ${LOAD_END + FADE}%, 100% { opacity: 0; width: 100%; }
}

@keyframes abr-create-press {
  0%, ${SUBMIT - 0.5}% { transform: scale(1); }
  ${SUBMIT}% { transform: scale(0.9); }
  ${SUBMIT + 1.5}%, 100% { transform: scale(1); }
}

.abr-create-load { width: 0%; animation: abr-create-load ${CYCLE}s ease-out infinite; }
.abr-create-press { animation: abr-create-press ${CYCLE}s ease-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .abr-create-cursor { animation: none; left: ${REST_POINT.x}%; top: ${REST_POINT.y}%; }
  ${enterClasses.map((name) => `.${name}`).join(", ")} { animation: none; opacity: 1; transform: none; }
  ${leaveClasses.map((name) => `.${name}`).join(", ")} { animation: none; opacity: 0; }
  ${COMMENT_CHARS.map((_, i) => `.abr-create-char-${i}`).join(", ")} { animation: none; }
  ${CLICKS.map((_, i) => `.abr-create-ripple-${i}`).join(", ")}, .abr-create-load { animation: none; opacity: 0; }
  .abr-create-press { animation: none; }
}
`;

export function ReviewLinkToFeedbackAnimation() {
  return (
    <div
      role="img"
      aria-label={ARIA_LABEL}
      className="@container flex aspect-[16/10] w-full flex-col gap-2"
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <StepIndicator />
      <div className="grid min-h-0 flex-1 grid-rows-1">
        <TerminalFrame
          title="yourclient.com/?ff_token=rt_7Kq2"
          contentClassName="flex min-h-0 flex-1 flex-col p-2 @[28rem]:p-3"
        >
          <MockPage />
        </TerminalFrame>
      </div>
    </div>
  );
}

function StepIndicator() {
  return (
    <div className="flex items-center gap-1.5 font-mono text-[10px] leading-4">
      {STEPS.map(({ label }, i) => (
        <span
          key={label}
          className="relative flex min-w-0 items-center gap-1.5 rounded-[4px] border border-border px-1.5 py-0.5 text-muted-foreground"
        >
          <span
            className={`abr-create-step-${i} absolute -inset-px rounded-[4px] border border-indigo-400/60 bg-indigo-400/10`}
          />
          <span className="relative">{i + 1}</span>
          <span className="relative truncate">{label}</span>
        </span>
      ))}
      <span className="ml-auto hidden text-muted-foreground @[30rem]:inline">
        no account · no extension
      </span>
    </div>
  );
}

function MockPage() {
  return (
    <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-md bg-zinc-950">
      <span className="abr-create-load absolute top-0 left-0 h-0.5 bg-indigo-400" />

      <PageSkeleton />

      <div className="abr-create-page absolute inset-0">
        {/* Navigation */}
        <div className="absolute inset-x-0 top-0 flex h-[12%] items-center gap-[4%] border-b border-zinc-800 px-[6%]">
          <span className="h-[30%] w-[10%] rounded-[2px] bg-zinc-700" />
          <span className="ml-auto h-[22%] w-[8%] rounded-[2px] bg-zinc-800" />
          <span className="h-[22%] w-[8%] rounded-[2px] bg-zinc-800" />
          <span className="h-[22%] w-[8%] rounded-[2px] bg-zinc-800" />
        </div>

        {/* Hero copy */}
        <div className="absolute top-[22%] left-[7%] h-[3%] w-[14%] rounded-[2px] bg-zinc-800" />
        <div className="absolute top-[29%] left-[7%] h-[6%] w-[38%] rounded-[2px] bg-zinc-600" />
        <div className="absolute top-[38%] left-[7%] h-[6%] w-[28%] rounded-[2px] bg-zinc-600" />
        <div className="absolute top-[48%] left-[7%] h-[3%] w-[36%] rounded-[2px] bg-zinc-800" />
        <div className="absolute top-[53%] left-[7%] h-[3%] w-[30%] rounded-[2px] bg-zinc-800" />

        {BUTTONS.map(({ x, y }, i) => (
          <div
            key={x}
            className={`absolute flex items-center justify-center rounded-[4px] ${i === 0 ? "bg-zinc-200" : "border border-zinc-700 bg-zinc-900"}`}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: `${BUTTON.width}%`,
              height: `${BUTTON.height}%`,
            }}
          >
            <span
              className={`h-[22%] w-[55%] rounded-[1px] ${i === 0 ? "bg-zinc-500" : "bg-zinc-600"}`}
            />
          </div>
        ))}

        {/* Hero image */}
        <div className="absolute top-[20%] left-[54%] h-[58%] w-[39%] rounded-md border border-zinc-800 bg-zinc-900" />
      </div>

      <AnnotationMode />

      <div
        className="abr-create-hover absolute rounded-[5px] border border-indigo-400/50"
        style={selectionFrame()}
      />
      <div
        className="abr-create-selected absolute rounded-[5px] border-2 border-dashed border-indigo-400/90 bg-indigo-400/10"
        style={selectionFrame()}
      >
        <span className="abr-create-pin absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-indigo-400 font-mono text-[9px] font-semibold text-zinc-950">
          1
        </span>
      </div>

      <CommentPanel />

      <Launcher />

      {CLICKS.map(({ x, y }, i) => (
        <span
          key={`${x}-${y}`}
          className={`abr-create-ripple-${i} absolute size-6 rounded-full border-2 border-indigo-400/80`}
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      ))}

      <MousePointer2Icon className="abr-create-cursor absolute size-4 fill-zinc-100 text-zinc-900" />
    </div>
  );
}

// What the page shows while the review link loads.
function PageSkeleton() {
  return (
    <div className="abr-create-skeleton absolute inset-0 flex flex-col gap-[4%] p-[7%] pt-[20%]">
      <span className="h-[6%] w-[38%] rounded-[2px] bg-zinc-900" />
      <span className="h-[6%] w-[28%] rounded-[2px] bg-zinc-900" />
      <span className="h-[3%] w-[36%] rounded-[2px] bg-zinc-900" />
    </div>
  );
}

function AnnotationMode() {
  return (
    <div className="abr-create-mode absolute inset-0">
      <div className="absolute inset-0 rounded-md ring-1 ring-indigo-400/40 ring-inset" />
      <span className="absolute top-[2.5%] left-1/2 -translate-x-1/2 rounded-full border border-indigo-400/40 bg-zinc-900 px-2 py-0.5 font-mono text-[9px] whitespace-nowrap text-indigo-300">
        Click an element to comment
      </span>
    </div>
  );
}

function Launcher() {
  return (
    <span
      className="abr-create-widget absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-indigo-500 shadow-lg"
      style={{ left: `${LAUNCHER_POINT.x}%`, top: `${LAUNCHER_POINT.y}%` }}
    >
      <MessageSquarePlusIcon className="size-3 text-white" />
    </span>
  );
}

function CommentPanel() {
  return (
    <div
      className="abr-create-panel absolute flex flex-col gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 p-2 shadow-lg"
      style={{
        left: `${PANEL.x}%`,
        top: `${PANEL.y}%`,
        width: `${PANEL.width}%`,
        height: `${PANEL.height}%`,
      }}
    >
      <span className="font-mono text-[9px] text-zinc-500">New Feedback</span>
      <span className="hidden truncate rounded-[3px] bg-zinc-800 px-1 font-mono text-[9px] text-indigo-300 @[26rem]:block">
        .hero .btn-secondary
      </span>
      <p className="min-h-0 flex-1 overflow-hidden text-[10px] leading-[13px] text-zinc-200 @[28rem]:text-[11px] @[28rem]:leading-4">
        {COMMENT_CHARS.map(({ char, key }, i) => (
          <span key={key} className={`abr-create-char-${i}`}>
            {char}
          </span>
        ))}
      </p>
      <span className="abr-create-press relative ml-auto flex h-5 w-11 shrink-0 items-center justify-center">
        <span className="abr-create-submit absolute inset-0 flex items-center justify-center rounded-[4px] bg-zinc-100 text-[10px] font-medium text-zinc-900">
          Submit
        </span>
        <span className="abr-create-sent absolute inset-0 flex items-center justify-center rounded-[4px] bg-emerald-500/15">
          <CheckIcon className="size-3 text-emerald-400" />
        </span>
      </span>
    </div>
  );
}

function selectionFrame() {
  return {
    left: `${MISALIGNED.x - 1.5}%`,
    top: `${MISALIGNED.y - 3}%`,
    width: `${BUTTON.width + 3}%`,
    height: `${BUTTON.height + 6}%`,
  };
}
