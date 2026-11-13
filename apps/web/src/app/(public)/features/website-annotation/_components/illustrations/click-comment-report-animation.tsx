import { TerminalFrame } from "@/app/(public)/(home)/_features/how-it-works/flow-animations";
import { CheckIcon, MousePointer2Icon, PlayIcon } from "lucide-react";
import type { ReactNode } from "react";

const CYCLE = 12;

// Percentages of the cycle.
const HOVER = 10;
const CLICK = 14;
const BUBBLE_OPEN = 17;
const TYPE_START = 20;
const TYPE_END = 42;
const SEND = 48;
const REPORT_START = 52;
const REPORT_STAGGER = 2.5;
const REST = 62;
const RESET = 94;

// Length of a fade in or out, in percentages of the cycle.
const FADE = 2;

const COMMENT = "This card sits 8px lower than the others.";

// Pricing cards, as percentages of the mock page. The second one sits lower
// than its neighbours: it is the misalignment the client reports.
const CARD = { width: 26, height: 28 };
const CARDS = [
  { x: 8, y: 34 },
  { x: 37, y: 39 },
  { x: 66, y: 34 },
] as const;
const MISALIGNED = CARDS[1];

// Cursor stops, as percentages of the mock page. A stop with `click` shows a
// ripple on arrival.
const REST_POINT = { x: 86, y: 20 };
const CARD_POINT = { x: 50, y: 53 };
const SEND_POINT = { x: 82, y: 87 };

const CURSOR_PATH = [
  { at: 0, ...REST_POINT, click: false },
  { at: HOVER, ...CARD_POINT, click: false },
  { at: CLICK, ...CARD_POINT, click: true },
  { at: TYPE_END, ...CARD_POINT, click: false },
  { at: SEND, ...SEND_POINT, click: true },
  { at: SEND + 4, ...SEND_POINT, click: false },
  { at: REST, ...REST_POINT, click: false },
  { at: 100, ...REST_POINT, click: false },
] as const;

const CLICKS = CURSOR_PATH.filter(({ click }) => click);

const ARIA_LABEL =
  "Animation showing a cursor selecting a misaligned pricing card on a client site, a comment typed and sent, then a report filling in with the selector, screenshot, URL, browser, console errors, network requests and the Recording.";

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

function cursorKeyframes() {
  const stops = CURSOR_PATH.map(
    ({ at, x, y }) => `${at}% { left: ${x}%; top: ${y}%; }`,
  ).join("\n  ");
  return `@keyframes wa-hero-cursor {\n  ${stops}\n}
.wa-hero-cursor { animation: wa-hero-cursor ${CYCLE}s ease-in-out infinite; }`;
}

function rippleKeyframes() {
  return CLICKS.map(
    ({ at }, i) => `@keyframes wa-hero-ripple-${i} {
  0%, ${at - 0.5}% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
  ${at}% { opacity: 1; transform: translate(-50%, -50%) scale(0.3); }
  ${at + 6}%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(1.6); }
}
.wa-hero-ripple-${i} { opacity: 0; animation: wa-hero-ripple-${i} ${CYCLE}s ease-out infinite; }`,
  ).join("\n");
}

const COMMENT_CHARS = Array.from(COMMENT, (char, i) => ({
  char,
  key: `${i}-${char}`,
  at: TYPE_START + ((TYPE_END - TYPE_START) * i) / COMMENT.length,
}));

// One keyframe per character: a shared keyframe with staggered delays would
// leave early characters showing when the next cycle opens the bubble.
function typingKeyframes() {
  return COMMENT_CHARS.map(
    ({ at }, i) =>
      `@keyframes wa-hero-char-${i} { 0% { opacity: 0; } ${at.toFixed(2)}%, 100% { opacity: 1; } }
.wa-hero-char-${i} { animation: wa-hero-char-${i} ${CYCLE}s step-end infinite; }`,
  ).join("\n");
}

type ReportRow = {
  label: string;
  value: ReactNode;
  skeletonClassName: string;
};

const REPORT_ROWS: ReportRow[] = [
  {
    label: "selector",
    value: (
      <span className="truncate text-indigo-300">
        .pricing .card:nth-child(2)
      </span>
    ),
    skeletonClassName: "h-1.5 w-[80%]",
  },
  {
    label: "screenshot",
    value: (
      <>
        <ScreenshotThumbnail />
        <span className="truncate text-zinc-500">1440 × 900</span>
      </>
    ),
    skeletonClassName: "h-9 w-12",
  },
  {
    label: "url",
    value: <span className="truncate text-zinc-300">/pricing</span>,
    skeletonClassName: "h-1.5 w-[30%]",
  },
  {
    label: "browser",
    value: <span className="truncate text-zinc-300">Chrome 131 · macOS</span>,
    skeletonClassName: "h-1.5 w-[60%]",
  },
  {
    label: "console",
    value: <span className="truncate text-red-400">1 error</span>,
    skeletonClassName: "h-1.5 w-[30%]",
  },
  {
    label: "network",
    value: <span className="truncate text-zinc-300">2 requests</span>,
    skeletonClassName: "h-1.5 w-[40%]",
  },
  {
    label: "recording",
    value: (
      <>
        <PlayIcon className="size-2.5 shrink-0 fill-zinc-300 text-zinc-300" />
        <span className="truncate text-zinc-300">0:58</span>
      </>
    ),
    skeletonClassName: "h-1.5 w-[20%]",
  },
];

// The comment opens the report, then each row fills in after it.
function reportAt(index: number) {
  return REPORT_START + index * REPORT_STAGGER;
}

function reportKeyframes() {
  return Array.from({ length: REPORT_ROWS.length + 1 }, (_, i) =>
    [
      enter(
        `wa-hero-report-${i}`,
        reportAt(i),
        "opacity: 0; transform: translateX(-4px);",
      ),
      leave(`wa-hero-skeleton-${i}`, reportAt(i)),
    ].join("\n"),
  ).join("\n");
}

const styles = `
${cursorKeyframes()}
${rippleKeyframes()}
${typingKeyframes()}
${reportKeyframes()}
${enter("wa-hero-selected", CLICK, "opacity: 0;")}
${enter("wa-hero-bubble", BUBBLE_OPEN, "opacity: 0; transform: translateY(6px) scale(0.98);")}
${enter("wa-hero-sent", SEND, "opacity: 0; transform: scale(0.6);")}
${enter("wa-hero-pin", SEND + FADE, "opacity: 0; transform: scale(0.5);")}
${leave("wa-hero-send", SEND)}

@keyframes wa-hero-hover {
  0%, ${HOVER - FADE}% { opacity: 0; }
  ${HOVER}%, ${CLICK}% { opacity: 1; }
  ${CLICK + 1}%, 100% { opacity: 0; }
}

@keyframes wa-hero-press {
  0%, ${SEND - 0.5}% { transform: scale(1); }
  ${SEND}% { transform: scale(0.9); }
  ${SEND + 1.5}%, 100% { transform: scale(1); }
}

@keyframes wa-hero-flash {
  0%, ${SEND}% { opacity: 0; }
  ${SEND + 1}% { opacity: 0.3; }
  ${SEND + 5}%, 100% { opacity: 0; }
}

.wa-hero-hover { opacity: 0; animation: wa-hero-hover ${CYCLE}s ease-out infinite; }
.wa-hero-press { animation: wa-hero-press ${CYCLE}s ease-out infinite; }
.wa-hero-flash { opacity: 0; animation: wa-hero-flash ${CYCLE}s ease-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .wa-hero-cursor { animation: none; left: ${REST_POINT.x}%; top: ${REST_POINT.y}%; }
  ${enterClasses.map((name) => `.${name}`).join(", ")} { animation: none; opacity: 1; transform: none; }
  ${leaveClasses.map((name) => `.${name}`).join(", ")} { animation: none; opacity: 0; }
  ${COMMENT_CHARS.map((_, i) => `.wa-hero-char-${i}`).join(", ")} { animation: none; }
  ${CLICKS.map((_, i) => `.wa-hero-ripple-${i}`).join(", ")}, .wa-hero-hover, .wa-hero-flash { animation: none; opacity: 0; }
  .wa-hero-press { animation: none; }
}
`;

export function ClickCommentReportAnimation() {
  return (
    <div role="img" aria-label={ARIA_LABEL} className="@container w-full">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="flex flex-col gap-3 @[28rem]:flex-row">
        <div className="grid min-w-0 flex-1">
          <TerminalFrame
            title="yourclient.com/pricing"
            contentClassName="flex flex-1 flex-col p-3"
          >
            <MockPage />
          </TerminalFrame>
        </div>
        <div className="grid min-w-0 @[28rem]:w-[48%]">
          <TerminalFrame
            title="Feedback #24"
            contentClassName="flex flex-col gap-3 p-3 font-mono text-[10px] leading-4"
          >
            <ReportComment />
            <div className="flex flex-col gap-1.5 border-t border-zinc-800 pt-3">
              {REPORT_ROWS.map(({ label, value, skeletonClassName }, i) => (
                <div key={label} className="flex min-w-0 items-center gap-2">
                  <span className="w-16 shrink-0 text-zinc-600">{label}</span>
                  <div className="relative flex min-w-0 flex-1 items-center">
                    <span
                      className={`wa-hero-skeleton-${i + 1} absolute left-0 rounded-[2px] bg-zinc-800 ${skeletonClassName}`}
                    />
                    <span
                      className={`wa-hero-report-${i + 1} flex min-w-0 items-center gap-2`}
                    >
                      {value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TerminalFrame>
        </div>
      </div>
    </div>
  );
}

function ReportComment() {
  return (
    <div className="relative">
      <div className="wa-hero-skeleton-0 absolute inset-x-0 top-0 flex flex-col gap-2 pt-1">
        <span className="h-1.5 w-[35%] rounded-[2px] bg-zinc-800" />
        <span className="h-2 w-[90%] rounded-[2px] bg-zinc-800" />
        <span className="h-2 w-[60%] rounded-[2px] bg-zinc-800" />
      </div>
      <div className="wa-hero-report-0 flex flex-col gap-1">
        <span className="text-zinc-500">Sarah · just now</span>
        <p className="font-sans text-[11px] leading-snug text-zinc-200">
          {COMMENT}
        </p>
      </div>
    </div>
  );
}

function MockPage() {
  return (
    <div className="relative aspect-[4/3] w-full grow overflow-hidden rounded-md bg-zinc-950">
      {/* Navigation */}
      <div className="absolute inset-x-0 top-0 flex h-[11%] items-center gap-[4%] border-b border-zinc-800 px-[6%]">
        <span className="h-[30%] w-[12%] rounded-[2px] bg-zinc-700" />
        <span className="ml-auto h-[22%] w-[9%] rounded-[2px] bg-zinc-800" />
        <span className="h-[22%] w-[9%] rounded-[2px] bg-zinc-800" />
      </div>

      {/* Heading */}
      <div className="absolute top-[17%] left-[30%] h-[5%] w-[40%] rounded-[2px] bg-zinc-700" />
      <div className="absolute top-[25%] left-[36%] h-[3%] w-[28%] rounded-[2px] bg-zinc-800" />

      {CARDS.map(({ x, y }) => (
        <div
          key={x}
          className="absolute flex flex-col gap-1 rounded-md border border-zinc-800 bg-zinc-900 p-1.5"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: `${CARD.width}%`,
            height: `${CARD.height}%`,
          }}
        >
          <span className="h-1 w-[45%] rounded-[1px] bg-zinc-700" />
          <span className="h-2 w-[60%] rounded-[2px] bg-zinc-600" />
          <span className="h-1 w-full rounded-[1px] bg-zinc-800" />
          <span className="h-1 w-[80%] rounded-[1px] bg-zinc-800" />
          <span className="mt-auto h-2 w-full rounded-[2px] bg-zinc-700" />
        </div>
      ))}

      <div
        className="wa-hero-hover absolute rounded-[6px] border border-indigo-400/50"
        style={selectionFrame()}
      />
      <div
        className="wa-hero-selected absolute rounded-[6px] border-2 border-dashed border-indigo-400/90 bg-indigo-400/10"
        style={selectionFrame()}
      >
        <span className="wa-hero-pin absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-indigo-400 font-mono text-[9px] font-semibold text-zinc-950">
          1
        </span>
      </div>

      <CommentBubble />

      <div className="wa-hero-flash absolute inset-0 bg-white" />

      {CLICKS.map(({ x, y }, i) => (
        <span
          key={`${x}-${y}`}
          className={`wa-hero-ripple-${i} absolute size-6 rounded-full border-2 border-indigo-400/80`}
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      ))}

      <MousePointer2Icon className="wa-hero-cursor absolute size-4 fill-zinc-100 text-zinc-900" />
    </div>
  );
}

function selectionFrame() {
  return {
    left: `${MISALIGNED.x - 1.5}%`,
    top: `${MISALIGNED.y - 3}%`,
    width: `${CARD.width + 3}%`,
    height: `${CARD.height + 6}%`,
  };
}

function CommentBubble() {
  return (
    <div className="wa-hero-bubble absolute inset-x-[8%] bottom-[4%]">
      {/* Points up at the selected card */}
      <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rotate-45 border-t border-l border-zinc-700 bg-zinc-900" />
      <div className="flex items-end gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-2 shadow-lg">
        <p className="min-w-0 flex-1 text-[11px] leading-4 text-zinc-200">
          {COMMENT_CHARS.map(({ char, key }, i) => (
            <span key={key} className={`wa-hero-char-${i}`}>
              {char}
            </span>
          ))}
        </p>
        <span className="wa-hero-press relative flex h-5 w-9 shrink-0 items-center justify-center">
          <span className="wa-hero-send absolute inset-0 flex items-center justify-center rounded-[4px] bg-zinc-100 text-[10px] font-medium text-zinc-900">
            Send
          </span>
          <span className="wa-hero-sent absolute inset-0 flex items-center justify-center rounded-[4px] bg-emerald-500/15">
            <CheckIcon className="size-3 text-emerald-400" />
          </span>
        </span>
      </div>
    </div>
  );
}

function ScreenshotThumbnail() {
  return (
    <span className="relative block h-9 w-12 shrink-0 overflow-hidden rounded-[3px] border border-zinc-800 bg-zinc-950">
      <span className="absolute inset-x-0 top-0 h-[11%] border-b border-zinc-800" />
      {CARDS.map(({ x, y }) => (
        <span
          key={x}
          className="absolute rounded-[1px] bg-zinc-800"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: `${CARD.width}%`,
            height: `${CARD.height}%`,
          }}
        />
      ))}
      <span
        className="absolute rounded-[2px] border border-indigo-400"
        style={selectionFrame()}
      />
    </span>
  );
}
