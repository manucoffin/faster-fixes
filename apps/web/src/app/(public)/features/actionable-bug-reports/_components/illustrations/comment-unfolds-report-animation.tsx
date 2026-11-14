import { TerminalFrame } from "@/app/(public)/(home)/_features/how-it-works/flow-animations";
import { PlayIcon } from "lucide-react";
import type { ReactNode } from "react";

const CYCLE = 12;

// Percentages of the cycle.
const PIN = 5;
const CHIP_IN = 8;
const INBOX_IN = 18;
const TRAVEL_START = 21;
const TRAVEL_END = 29;
const UNFOLD = 31;
const PARTS_START = 35;
const PART_STAGGER = 4;
const PLAYBACK = 18;
const RESET = 94;

// Length of a fade in or out, in percentages of the cycle.
const FADE = 2;

const COMMENT = "The Pay button does nothing.";

// Where the comment chip sits, as percentages of the whole illustration: above
// the Pay button on the page, then over the comment of the report it opens.
const CHIP_ON_PAGE = { x: 33, y: 41 };
const CHIP_IN_REPORT = { x: 13, y: 30 };

const ARIA_LABEL =
  "Animation showing a Reviewer's one-line comment on a checkout page travelling into the inbox, where it unfolds into a full Feedback: the page /checkout, the element button#pay, Safari 18 on iOS 18, a Screenshot with the Selection outlined, a console TypeError, a POST /api/pay request that failed with a 500 and a Recording of the moments before, each part landing in turn.";

const HIDDEN = "opacity: 0; transform: translateY(-4px);";
const SHOWN = "opacity: 1; transform: none;";

// Classes that end the cycle shown, and the one-off flashes, so the
// reduced-motion block can freeze each on its final state.
const enterClasses: string[] = [];
const flashClasses: string[] = [];

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

// A brief highlight as a part lands.
function flash(name: string, at: number) {
  flashClasses.push(name);
  return `@keyframes ${name} {
  0%, ${at}% { opacity: 0; }
  ${at + 1}% { opacity: 1; }
  ${at + 6}%, 100% { opacity: 0; }
}
.${name} { opacity: 0; animation: ${name} ${CYCLE}s ease-out infinite; }`;
}

type Part = {
  label: string;
  value: ReactNode;
};

// In landing order. The Screenshot and the Recording sit in the left column,
// the other parts in the right one.
const PAGE = 0;
const ELEMENT = 1;
const BROWSER = 2;
const SCREENSHOT = 3;
const CONSOLE = 4;
const NETWORK = 5;
const RECORDING = 6;
const PART_COUNT = 7;

const ROWS: (Part & { index: number })[] = [
  {
    index: PAGE,
    label: "page",
    value: <span className="truncate text-zinc-300">/checkout</span>,
  },
  {
    index: ELEMENT,
    label: "element",
    value: <span className="truncate text-indigo-300">button#pay</span>,
  },
  {
    index: BROWSER,
    label: "browser",
    value: <span className="truncate text-zinc-300">Safari 18 · iOS 18</span>,
  },
  {
    index: CONSOLE,
    label: "console",
    value: (
      <span className="truncate text-red-400">
        TypeError: pay is not a function
      </span>
    ),
  },
  {
    index: NETWORK,
    label: "network",
    value: (
      <span className="truncate text-zinc-300">
        POST /api/pay <span className="text-red-400">500</span>
      </span>
    ),
  },
];

function partAt(index: number) {
  return PARTS_START + index * PART_STAGGER;
}

function partKeyframes() {
  return Array.from({ length: PART_COUNT }, (_, i) =>
    [
      enter(`abr-hero-part-${i}`, partAt(i)),
      enter(`abr-hero-step-${i}`, partAt(i), "opacity: 0;"),
      flash(`abr-hero-flash-${i}`, partAt(i)),
    ].join("\n"),
  ).join("\n");
}

function chipKeyframes() {
  const from = `left: ${CHIP_ON_PAGE.x}%; top: ${CHIP_ON_PAGE.y}%;`;
  const to = `left: ${CHIP_IN_REPORT.x}%; top: ${CHIP_IN_REPORT.y}%;`;
  return `@keyframes abr-hero-chip {
  0%, ${CHIP_IN}% { opacity: 0; ${from} transform: translateY(4px) scale(0.96); }
  ${CHIP_IN + FADE}%, ${TRAVEL_START}% { opacity: 1; ${from} transform: none; }
  ${TRAVEL_END}% { opacity: 1; ${to} transform: scale(0.94); }
  ${TRAVEL_END + FADE}%, 100% { opacity: 0; ${to} transform: scale(0.94); }
}
.abr-hero-chip { opacity: 0; animation: abr-hero-chip ${CYCLE}s ease-in-out infinite; }`;
}

const PLAYHEAD_START = partAt(RECORDING) + FADE;

const styles = `
${chipKeyframes()}
${partKeyframes()}
${enter("abr-hero-pin", PIN, "opacity: 0; transform: scale(0.5);")}
${enter("abr-hero-inbox", INBOX_IN, "opacity: 0; transform: translateY(6%);")}
${enter("abr-hero-comment", TRAVEL_END, "opacity: 0;")}

@keyframes abr-hero-page {
  0%, ${INBOX_IN}% { opacity: 1; transform: none; }
  ${INBOX_IN + FADE}%, ${RESET}% { opacity: 0.45; transform: scale(0.97); }
  ${RESET + FADE}%, 100% { opacity: 1; transform: none; }
}

@keyframes abr-hero-unfold {
  0%, ${UNFOLD}% { clip-path: inset(0 0 100% 0); }
  ${UNFOLD + 3}%, ${RESET}% { clip-path: inset(0 0 0 0); }
  ${RESET + FADE}%, 100% { clip-path: inset(0 0 100% 0); }
}

@keyframes abr-hero-playhead {
  0%, ${PLAYHEAD_START}% { left: 0%; }
  ${PLAYHEAD_START + PLAYBACK}%, 100% { left: 100%; }
}

.abr-hero-page { transform-origin: top center; animation: abr-hero-page ${CYCLE}s ease-out infinite; }
.abr-hero-unfold { animation: abr-hero-unfold ${CYCLE}s ease-out infinite; }
.abr-hero-playhead { animation: abr-hero-playhead ${CYCLE}s linear infinite; }

@media (prefers-reduced-motion: reduce) {
  ${enterClasses.map((name) => `.${name}`).join(", ")} { animation: none; opacity: 1; transform: none; }
  ${flashClasses.map((name) => `.${name}`).join(", ")}, .abr-hero-chip { animation: none; opacity: 0; }
  .abr-hero-page { animation: none; opacity: 0.45; transform: scale(0.97); }
  .abr-hero-unfold { animation: none; clip-path: none; }
  .abr-hero-playhead { animation: none; left: 100%; }
}
`;

export function CommentUnfoldsReportAnimation() {
  return (
    <div
      role="img"
      aria-label={ARIA_LABEL}
      className="@container relative aspect-[4/3] w-full"
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="abr-hero-page absolute inset-x-[4%] top-0 grid h-[72%]">
        <TerminalFrame
          title="yourclient.com/checkout"
          contentClassName="flex min-h-0 flex-1 flex-col p-2.5"
        >
          <CheckoutPage />
        </TerminalFrame>
      </div>

      <div className="abr-hero-inbox absolute top-[16%] right-0 bottom-0 left-[10%] grid">
        <TerminalFrame
          title="Inbox · Feedback #128"
          contentClassName="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden p-2.5 font-mono text-[10px] leading-4 @[28rem]:gap-4 @[28rem]:p-4 @[28rem]:text-xs @[28rem]:leading-5"
        >
          <ReportComment />
          <div className="abr-hero-unfold grid min-h-0 grid-cols-[40%_1fr] gap-2.5 border-t border-zinc-800 pt-2.5 @[28rem]:gap-4 @[28rem]:pt-4">
            <div className="flex min-w-0 flex-col gap-1.5 @[28rem]:gap-3">
              <PartSlot index={SCREENSHOT}>
                <ScreenshotThumbnail />
              </PartSlot>
              <PartSlot index={RECORDING}>
                <RecordingStrip />
              </PartSlot>
            </div>
            <div className="flex min-w-0 flex-col gap-1 @[28rem]:gap-2.5">
              {ROWS.map(({ index, label, value }) => (
                <PartSlot key={label} index={index}>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="w-12 shrink-0 text-zinc-600 @[28rem]:w-16">
                      {label}
                    </span>
                    <span className="flex min-w-0 items-center">{value}</span>
                  </div>
                </PartSlot>
              ))}
            </div>
          </div>
        </TerminalFrame>
      </div>

      <div className="abr-hero-chip absolute">
        <CommentChip />
      </div>
    </div>
  );
}

type PartSlotProps = {
  index: number;
  children: ReactNode;
};

function PartSlot({ index, children }: PartSlotProps) {
  return (
    <div className="relative min-w-0">
      <span
        className={`abr-hero-flash-${index} absolute -inset-x-1 -inset-y-0.5 rounded-[3px] bg-indigo-400/15`}
      />
      <div className={`abr-hero-part-${index} relative min-w-0`}>
        {children}
      </div>
    </div>
  );
}

function ReportComment() {
  return (
    <div className="abr-hero-comment flex shrink-0 flex-col gap-0.5">
      <div className="flex items-center gap-2">
        <span className="text-zinc-500">Marc · just now</span>
        <span className="rounded-[3px] bg-indigo-400/15 px-1 text-[9px] leading-3.5 text-indigo-300">
          new
        </span>
        <div className="ml-auto flex items-center gap-0.5" aria-hidden>
          {Array.from({ length: PART_COUNT }, (_, i) => (
            <span
              key={i}
              className="relative h-1 w-2 overflow-hidden rounded-full bg-zinc-800"
            >
              <span
                className={`abr-hero-step-${i} absolute inset-0 bg-indigo-400`}
              />
            </span>
          ))}
        </div>
      </div>
      <p className="truncate font-sans text-[11px] leading-4 text-zinc-200 @[28rem]:text-sm @[28rem]:leading-5">
        {COMMENT}
      </p>
    </div>
  );
}

function CommentChip() {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 whitespace-nowrap shadow-lg">
      <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-indigo-400 font-mono text-[8px] font-semibold text-zinc-950">
        1
      </span>
      <span className="text-[11px] leading-4 text-zinc-200">{COMMENT}</span>
    </div>
  );
}

function CheckoutPage() {
  return (
    <div className="relative min-h-0 w-full grow overflow-hidden rounded-md bg-zinc-950">
      <CheckoutLayout withLabel />
      <span className="abr-hero-pin absolute top-[66%] right-[6%] flex size-3.5 items-center justify-center rounded-full bg-indigo-400 font-mono text-[8px] font-semibold text-zinc-950 ring-2 ring-zinc-950">
        1
      </span>
    </div>
  );
}

type CheckoutLayoutProps = {
  withLabel?: boolean;
};

// Shared by the live page and its Screenshot, so the thumbnail matches.
function CheckoutLayout({ withLabel = false }: CheckoutLayoutProps) {
  return (
    <>
      {/* Navigation */}
      <span className="absolute top-[8%] left-[5%] h-[5%] w-[12%] rounded-[2px] bg-zinc-700" />
      <span className="absolute inset-x-0 top-[18%] h-px bg-zinc-800" />

      {/* Cart lines */}
      <span className="absolute top-[26%] left-[5%] h-[6%] w-[28%] rounded-[2px] bg-zinc-700" />
      {[38, 52, 66].map((top) => (
        <span key={top}>
          <span
            className="absolute left-[5%] h-[9%] w-[7%] rounded-[2px] bg-zinc-800"
            style={{ top: `${top}%` }}
          />
          <span
            className="absolute left-[15%] h-[4%] w-[24%] rounded-[2px] bg-zinc-800"
            style={{ top: `${top + 2.5}%` }}
          />
          <span
            className="absolute left-[46%] h-[4%] w-[8%] rounded-[2px] bg-zinc-800"
            style={{ top: `${top + 2.5}%` }}
          />
        </span>
      ))}

      {/* Order summary */}
      <div className="absolute top-[26%] right-[5%] bottom-[10%] w-[34%] rounded-md border border-zinc-800 bg-zinc-900">
        <span className="absolute top-[10%] left-[10%] h-[7%] w-[40%] rounded-[2px] bg-zinc-700" />
        <span className="absolute top-[28%] left-[10%] h-[5%] w-[80%] rounded-[2px] bg-zinc-800" />
        <span className="absolute top-[40%] left-[10%] h-[5%] w-[65%] rounded-[2px] bg-zinc-800" />
        <span className="absolute top-[52%] left-[10%] h-[7%] w-[50%] rounded-[2px] bg-zinc-600" />
        <span className="absolute inset-x-[10%] top-[70%] bottom-[10%] flex items-center justify-center rounded-[3px] bg-zinc-200">
          {withLabel && (
            <span className="font-sans text-[9px] font-medium text-zinc-900">
              Pay
            </span>
          )}
        </span>
      </div>
    </>
  );
}

function ScreenshotThumbnail() {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-zinc-600">screenshot</span>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[3px] border border-zinc-800 bg-zinc-950">
        <CheckoutLayout />
        {/* Selection frame around the Pay button */}
        <span className="absolute top-[68%] right-[6.5%] bottom-[14%] w-[31%] rounded-[3px] border border-dashed border-indigo-400 bg-indigo-400/10" />
      </div>
    </div>
  );
}

function RecordingStrip() {
  return (
    <div className="flex items-center gap-1.5">
      <PlayIcon className="size-2.5 shrink-0 fill-zinc-300 text-zinc-300" />
      <span className="relative h-0.5 min-w-0 flex-1 rounded-full bg-zinc-800">
        {[12, 30, 46, 63, 80].map((x) => (
          <span
            key={x}
            className="absolute top-1/2 h-1.5 w-px -translate-y-1/2 bg-zinc-600"
            style={{ left: `${x}%` }}
          />
        ))}
        <span className="abr-hero-playhead absolute top-1/2 h-2 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-100" />
      </span>
      <span className="shrink-0 text-zinc-500">0:42</span>
    </div>
  );
}
