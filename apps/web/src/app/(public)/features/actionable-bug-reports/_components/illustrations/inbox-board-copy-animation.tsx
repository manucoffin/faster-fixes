import { TerminalFrame } from "@/app/(public)/(home)/_features/how-it-works/flow-animations";
import { CheckIcon, GrabIcon, MousePointer2Icon } from "lucide-react";
import type { ReactNode } from "react";

const CYCLE = 12;

// Percentages of the cycle.
const ASSIGN_ARRIVE = 8;
const ASSIGN = 11;
const GRAB_ARRIVE = 18;
const GRAB = 20;
const DRAG_END = 31;
const DROP = 33;
const SELECT_ARRIVE = 40;
const SELECT = 42;
const COPY_ARRIVE = 49;
const COPY = 51;
const PANEL = 54;
const LINE_START = 57;
const LINE_STAGGER = 2.5;
const CURSOR_HOME = 64;
const RESET = 90;

// Length of a fade or a settle, in percentages of the cycle.
const FADE = 2;
const LIFT = 1.5;

// Board geometry, as percentages of the board area. Columns are 32% wide
// with a 2% gutter; a card sits 1% inside its column.
const COLUMN_X = [0, 34, 68] as const;
const CARD_X = [1, 35, 69] as const;
const CARD_WIDTH = 30;
const CARD_HEIGHT = 34;
const SLOT_Y = [13, 50] as const;

// Cursor stops, as percentages of the board area. A stop with `click` shows
// a ripple on arrival.
const REST_POINT = { x: 86, y: 5 };
const AVATAR_POINT = { x: 28, y: 41 };
const GRAB_POINT = { x: 14, y: 27 };
const DROP_POINT = { x: 48, y: 27 };
const CHECKBOX_POINT = { x: 37.5, y: 41 };
const COPY_POINT = { x: 63, y: 92 };

const CURSOR_PATH = [
  { at: 0, ...REST_POINT, click: false },
  { at: 3, ...REST_POINT, click: false },
  { at: ASSIGN_ARRIVE, ...AVATAR_POINT, click: false },
  { at: ASSIGN, ...AVATAR_POINT, click: true },
  { at: 13, ...AVATAR_POINT, click: false },
  { at: GRAB_ARRIVE, ...GRAB_POINT, click: false },
  { at: GRAB, ...GRAB_POINT, click: false },
  { at: DRAG_END, ...DROP_POINT, click: false },
  { at: DROP + 1, ...DROP_POINT, click: false },
  { at: SELECT_ARRIVE, ...CHECKBOX_POINT, click: false },
  { at: SELECT, ...CHECKBOX_POINT, click: true },
  { at: SELECT + 2, ...CHECKBOX_POINT, click: false },
  { at: COPY_ARRIVE, ...COPY_POINT, click: false },
  { at: COPY, ...COPY_POINT, click: true },
  { at: PANEL, ...COPY_POINT, click: false },
  { at: CURSOR_HOME, ...REST_POINT, click: false },
  { at: 100, ...REST_POINT, click: false },
] as const;

const CLICKS = CURSOR_PATH.filter(({ click }) => click);

type CardStop = { at: number; x: number; y: number; opacity?: number };
type CardPath = [CardStop, ...CardStop[]];

// The dragged card hides at the reset, jumps back to New while hidden, then
// fades in once the other cards have slid back into place.
const DRAGGED_PATH: CardPath = [
  { at: 0, x: CARD_X[0], y: SLOT_Y[0], opacity: 1 },
  { at: GRAB, x: CARD_X[0], y: SLOT_Y[0], opacity: 1 },
  { at: DRAG_END, x: CARD_X[1], y: SLOT_Y[0], opacity: 1 },
  { at: RESET, x: CARD_X[1], y: SLOT_Y[0], opacity: 1 },
  { at: RESET + FADE, x: CARD_X[1], y: SLOT_Y[0], opacity: 0 },
  { at: RESET + FADE + 0.1, x: CARD_X[0], y: SLOT_Y[0], opacity: 0 },
  { at: RESET + 3 * FADE, x: CARD_X[0], y: SLOT_Y[0], opacity: 0 },
  { at: 100, x: CARD_X[0], y: SLOT_Y[0], opacity: 1 },
];

// The other New card moves up once the dragged one has left.
const NEW_PATH: CardPath = [
  { at: 0, x: CARD_X[0], y: SLOT_Y[1] },
  { at: DROP, x: CARD_X[0], y: SLOT_Y[1] },
  { at: DROP + 4, x: CARD_X[0], y: SLOT_Y[0] },
  { at: RESET + FADE, x: CARD_X[0], y: SLOT_Y[0] },
  { at: RESET + 3 * FADE, x: CARD_X[0], y: SLOT_Y[1] },
  { at: 100, x: CARD_X[0], y: SLOT_Y[1] },
];

// The In Progress card makes room as the dragged card comes over.
const IN_PROGRESS_PATH: CardPath = [
  { at: 0, x: CARD_X[1], y: SLOT_Y[0] },
  { at: GRAB + 4, x: CARD_X[1], y: SLOT_Y[0] },
  { at: DRAG_END - 2, x: CARD_X[1], y: SLOT_Y[1] },
  { at: RESET + FADE, x: CARD_X[1], y: SLOT_Y[1] },
  { at: RESET + 3 * FADE, x: CARD_X[1], y: SLOT_Y[0] },
  { at: 100, x: CARD_X[1], y: SLOT_Y[0] },
];

const COMMENT = "Pricing card sits 8px lower.";

type MarkdownLine = { key: string; marker: string; value: string };

// The head of what `formatFeedbackAsMarkdown` writes for this Feedback.
const MARKDOWN_LINES: MarkdownLine[] = [
  { key: "title", marker: "# ", value: "Feedback fb_24" },
  { key: "status", marker: "**Status:** ", value: "in_progress" },
  { key: "url", marker: "**Page URL:** ", value: "yourclient.com/pricing" },
  {
    key: "selector",
    marker: "**DOM selector:** ",
    value: "`.card:nth-child(2)`",
  },
  { key: "comment", marker: "> ", value: COMMENT },
];

const COLUMNS = [
  { label: "New", dot: "bg-indigo-400", before: 2, after: 1 },
  { label: "In Progress", dot: "bg-amber-400", before: 1, after: 2 },
  { label: "Resolved", dot: "bg-emerald-400", before: 1, after: 1 },
] as const;

const ARIA_LABEL =
  "Animation showing the Faster Fixes Kanban board with New, In Progress and Resolved columns: a new Feedback is assigned, dragged from New to In Progress, selected, then copied as markdown, and its plain-text markdown appears on the clipboard.";

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

function pathKeyframes(name: string, path: CardPath) {
  const stops = path
    .map(
      ({ at, x, y, opacity }) =>
        `${at}% { left: ${x}%; top: ${y}%;${opacity === undefined ? "" : ` opacity: ${opacity};`} }`,
    )
    .join("\n  ");
  // The resting position lives in the class, not inline, so the
  // reduced-motion block can override it.
  const [{ x, y }] = path;
  return `@keyframes ${name} {\n  ${stops}\n}
.${name} { left: ${x}%; top: ${y}%; animation: ${name} ${CYCLE}s ease-in-out infinite; }`;
}

function cursorKeyframes() {
  const stops = CURSOR_PATH.map(
    ({ at, x, y }) => `${at}% { left: ${x}%; top: ${y}%; }`,
  ).join("\n  ");
  return `@keyframes abr-inbox-cursor {\n  ${stops}\n}
.abr-inbox-cursor { animation: abr-inbox-cursor ${CYCLE}s ease-in-out infinite; }`;
}

function rippleKeyframes() {
  return CLICKS.map(
    ({ at }, i) => `@keyframes abr-inbox-ripple-${i} {
  0%, ${at - 0.5}% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
  ${at}% { opacity: 1; transform: translate(-50%, -50%) scale(0.3); }
  ${at + 6}%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(1.6); }
}
.abr-inbox-ripple-${i} { opacity: 0; animation: abr-inbox-ripple-${i} ${CYCLE}s ease-out infinite; }`,
  ).join("\n");
}

function lineKeyframes() {
  return MARKDOWN_LINES.map((_, i) =>
    enter(
      `abr-inbox-line-${i}`,
      LINE_START + i * LINE_STAGGER,
      "opacity: 0; transform: translateX(-4px);",
    ),
  ).join("\n");
}

const LIFTED =
  "transform: rotate(2deg) scale(1.04); box-shadow: 0 10px 24px -8px rgb(0 0 0 / 0.7);";
const RESTING = "transform: none; box-shadow: 0 0 0 0 rgb(0 0 0 / 0);";

const styles = `
${cursorKeyframes()}
${rippleKeyframes()}
${pathKeyframes("abr-inbox-dragged", DRAGGED_PATH)}
${pathKeyframes("abr-inbox-new", NEW_PATH)}
${pathKeyframes("abr-inbox-progress", IN_PROGRESS_PATH)}
${enter("abr-inbox-assigned", ASSIGN, "opacity: 0; transform: scale(0.5);")}
${leave("abr-inbox-unassigned", ASSIGN)}
${enter("abr-inbox-status-after", DROP, "opacity: 0;")}
${leave("abr-inbox-status-before", DROP)}
${enter("abr-inbox-count-after", DROP, "opacity: 0;")}
${leave("abr-inbox-count-before", DROP)}
${enter("abr-inbox-selected", SELECT, "opacity: 0;")}
${enter("abr-inbox-checked", SELECT, "opacity: 0; transform: scale(0.6);")}
${enter("abr-inbox-toolbar", SELECT + 1)}
${enter("abr-inbox-copied", COPY, "opacity: 0; transform: scale(0.9);")}
${leave("abr-inbox-copy", COPY)}
${enter("abr-inbox-panel", PANEL, "opacity: 0; transform: translateY(8px);")}
${lineKeyframes()}

@keyframes abr-inbox-lift {
  0%, ${GRAB}% { ${RESTING} }
  ${GRAB + LIFT}%, ${DRAG_END}% { ${LIFTED} }
  ${DROP}%, 100% { ${RESTING} }
}

@keyframes abr-inbox-pointer {
  0%, ${GRAB - 0.5}% { opacity: 1; }
  ${GRAB}%, ${DROP}% { opacity: 0; }
  ${DROP + 0.5}%, 100% { opacity: 1; }
}

@keyframes abr-inbox-grab {
  0%, ${GRAB - 0.5}% { opacity: 0; }
  ${GRAB}%, ${DROP}% { opacity: 1; }
  ${DROP + 0.5}%, 100% { opacity: 0; }
}

.abr-inbox-lift { animation: abr-inbox-lift ${CYCLE}s ease-out infinite; }
.abr-inbox-pointer { animation: abr-inbox-pointer ${CYCLE}s step-end infinite; }
.abr-inbox-grab { opacity: 0; animation: abr-inbox-grab ${CYCLE}s step-end infinite; }

@media (prefers-reduced-motion: reduce) {
  .abr-inbox-cursor { animation: none; left: ${REST_POINT.x}%; top: ${REST_POINT.y}%; }
  .abr-inbox-dragged { animation: none; left: ${CARD_X[1]}%; top: ${SLOT_Y[0]}%; opacity: 1; }
  .abr-inbox-new { animation: none; top: ${SLOT_Y[0]}%; }
  .abr-inbox-progress { animation: none; top: ${SLOT_Y[1]}%; }
  ${enterClasses.map((name) => `.${name}`).join(", ")} { animation: none; opacity: 1; transform: none; }
  ${leaveClasses.map((name) => `.${name}`).join(", ")} { animation: none; opacity: 0; }
  ${CLICKS.map((_, i) => `.abr-inbox-ripple-${i}`).join(", ")}, .abr-inbox-grab { animation: none; opacity: 0; }
  .abr-inbox-pointer { animation: none; opacity: 1; }
  .abr-inbox-lift { animation: none; transform: none; box-shadow: none; }
}
`;

export function InboxBoardCopyAnimation() {
  return (
    <div
      role="img"
      aria-label={ARIA_LABEL}
      className="grid aspect-[16/10] w-full"
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <TerminalFrame
        title="Faster Fixes · Inbox"
        contentClassName="flex min-h-0 flex-1 p-2.5 font-mono text-[9px] leading-[11px] sm:p-3 sm:text-[10px] sm:leading-[13px]"
      >
        <Board />
      </TerminalFrame>
    </div>
  );
}

function Board() {
  return (
    <div className="relative min-h-0 flex-1">
      {COLUMNS.map(({ label, dot, before, after }, i) => (
        <div
          key={label}
          className="absolute top-0 flex h-[10%] min-w-0 items-center gap-1.5 px-1"
          style={{ left: `${COLUMN_X[i]}%`, width: "32%" }}
        >
          <span className={`size-1.5 shrink-0 rounded-full ${dot}`} />
          <span className="truncate text-zinc-400">{label}</span>
          <span className="grid text-zinc-600">
            <span className="abr-inbox-count-before [grid-area:1/1]">
              {before}
            </span>
            <span className="abr-inbox-count-after [grid-area:1/1]">
              {after}
            </span>
          </span>
        </div>
      ))}

      {COLUMN_X.map((x) => (
        <div
          key={x}
          className="absolute top-[11%] bottom-0 rounded-md border border-zinc-800 bg-zinc-950/60"
          style={{ left: `${x}%`, width: "32%" }}
        />
      ))}

      <CardSlot className="abr-inbox-new">
        <Card
          comment="Footer links overlap on mobile."
          status={<StatusDot className="bg-indigo-400" />}
          avatar={<UnassignedAvatar />}
        />
      </CardSlot>

      <CardSlot className="abr-inbox-progress">
        <Card
          comment="Signup button does nothing in Safari."
          status={<StatusDot className="bg-amber-400" />}
          avatar={<Avatar initials="JM" className="bg-sky-500" />}
        />
      </CardSlot>

      <CardSlot position={{ x: CARD_X[2], y: SLOT_Y[0] }}>
        <Card
          comment="Logo is blurry on retina screens."
          status={<StatusDot className="bg-emerald-400" />}
          avatar={<Avatar initials="JM" className="bg-sky-500" />}
          muted
        />
      </CardSlot>

      <CardSlot className="abr-inbox-dragged z-10">
        <div className="abr-inbox-lift relative h-full rounded-md">
          <Card
            comment={COMMENT}
            selectable
            status={
              <span className="grid">
                <StatusDot className="abr-inbox-status-before bg-indigo-400 [grid-area:1/1]" />
                <StatusDot className="abr-inbox-status-after bg-amber-400 [grid-area:1/1]" />
              </span>
            }
            avatar={
              <span className="grid">
                <span className="abr-inbox-unassigned [grid-area:1/1]">
                  <UnassignedAvatar />
                </span>
                <span className="abr-inbox-assigned [grid-area:1/1]">
                  <Avatar initials="AL" className="bg-violet-500" />
                </span>
              </span>
            }
          />
          <span className="abr-inbox-selected pointer-events-none absolute inset-0 rounded-md border border-indigo-400/80 bg-indigo-400/10" />
        </div>
      </CardSlot>

      <Toolbar />
      <ClipboardPanel />

      {CLICKS.map(({ x, y }, i) => (
        <span
          key={`${x}-${y}`}
          className={`abr-inbox-ripple-${i} absolute z-30 size-6 rounded-full border-2 border-indigo-400/80`}
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      ))}

      <span className="abr-inbox-cursor absolute z-30 size-4">
        <MousePointer2Icon className="abr-inbox-pointer absolute inset-0 size-4 fill-zinc-100 text-zinc-900" />
        <GrabIcon className="abr-inbox-grab absolute -top-1.5 -left-1.5 size-4 fill-zinc-100 text-zinc-900" />
      </span>
    </div>
  );
}

type CardSlotProps = {
  // Inline only for a card that never moves: an animated card takes its
  // position from its class.
  position?: { x: number; y: number };
  className?: string;
  children: ReactNode;
};

// Positioned on the board's percentage grid, so the cursor stops line up.
function CardSlot({ position, className, children }: CardSlotProps) {
  return (
    <div
      className={`absolute ${className ?? ""}`}
      style={{
        ...(position && { left: `${position.x}%`, top: `${position.y}%` }),
        width: `${CARD_WIDTH}%`,
        height: `${CARD_HEIGHT}%`,
      }}
    >
      {children}
    </div>
  );
}

type CardProps = {
  comment: string;
  status: ReactNode;
  avatar: ReactNode;
  selectable?: boolean;
  muted?: boolean;
};

function Card({ comment, status, avatar, selectable, muted }: CardProps) {
  return (
    <div className="flex h-full min-w-0 flex-col justify-between gap-1 rounded-md border border-zinc-700 bg-zinc-800 p-1.5 sm:p-2">
      <span
        className={`line-clamp-2 font-sans leading-snug ${muted ? "text-zinc-500" : "text-zinc-200"}`}
      >
        {comment}
      </span>
      <div className="flex min-w-0 items-center gap-1.5 text-zinc-500">
        {selectable ? <Checkbox /> : <EmptyCheckbox />}
        {status}
        <span className="truncate">/pricing</span>
        <span className="ml-auto shrink-0">{avatar}</span>
      </div>
    </div>
  );
}

function EmptyCheckbox() {
  return (
    <span className="size-2.5 shrink-0 rounded-[2px] border border-zinc-600" />
  );
}

function Checkbox() {
  return (
    <span className="relative size-2.5 shrink-0">
      <span className="absolute inset-0 rounded-[2px] border border-zinc-600" />
      <span className="abr-inbox-checked absolute inset-0 flex items-center justify-center rounded-[2px] bg-indigo-400">
        <CheckIcon className="size-2 text-zinc-950" strokeWidth={3} />
      </span>
    </span>
  );
}

type StatusDotProps = { className: string };

function StatusDot({ className }: StatusDotProps) {
  return <span className={`size-1.5 shrink-0 rounded-full ${className}`} />;
}

function UnassignedAvatar() {
  return (
    <span className="block size-3.5 rounded-full border border-dashed border-zinc-500" />
  );
}

type AvatarProps = { initials: string; className: string };

function Avatar({ initials, className }: AvatarProps) {
  return (
    <span
      className={`flex size-3.5 items-center justify-center rounded-full font-sans text-[6px] font-semibold text-white ${className}`}
    >
      {initials}
    </span>
  );
}

function Toolbar() {
  return (
    <div className="abr-inbox-toolbar absolute inset-x-[24%] top-[87%] bottom-[2%] z-10 flex items-center justify-between gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-1.5 shadow-lg">
      <span className="truncate text-zinc-400">1 selected</span>
      <span className="grid h-[75%] shrink-0 rounded-[4px] border border-zinc-700 bg-zinc-800 text-zinc-200">
        <span className="abr-inbox-copy flex items-center px-1.5 [grid-area:1/1]">
          Copy markdown
        </span>
        <span className="abr-inbox-copied flex items-center justify-center gap-1 text-emerald-400 [grid-area:1/1]">
          <CheckIcon className="size-2.5" />
          Copied
        </span>
      </span>
    </div>
  );
}

function ClipboardPanel() {
  return (
    <div className="abr-inbox-panel absolute inset-x-[1%] top-[49%] bottom-[1%] z-20 flex flex-col gap-1 overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 p-1.5 shadow-xl sm:gap-1.5 sm:p-2">
      <div className="flex items-center justify-between gap-2 text-zinc-500">
        <span className="truncate">clipboard</span>
        <span className="shrink-0 text-zinc-600">text/plain</span>
      </div>
      <div className="flex min-w-0 flex-col">
        {MARKDOWN_LINES.map(({ key, marker, value }, i) => (
          <span key={key} className={`abr-inbox-line-${i} truncate`}>
            <span className="text-zinc-500">{marker}</span>
            <span className="text-zinc-200">{value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
