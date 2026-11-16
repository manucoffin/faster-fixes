import { TrelloIcon } from "@workspace/ui/components/icons/trello-icon";
import { cn } from "@workspace/ui/lib/utils";
import {
  CheckIcon,
  LinkIcon,
  MousePointer2Icon,
  PlayIcon,
  TerminalIcon,
} from "lucide-react";
import type { ReactNode } from "react";

const CYCLE = 10;

// Percentages of the cycle.
const PIN = 5;
const POPOVER_IN = 7;
const TYPE_START = 10;
const TYPE_END = 22;
const SEND = 28;
const POPOVER_OUT = 33;
const CARD_IN = 36;
const PARTS_START = 47;
const PART_STAGGER = 7;
const RESET = 92;

// Length of a fade in or out, in percentages of the cycle.
const FADE = 2;

const COMMENT = "Hero image is cropped.";

// Cursor targets, relative to the mock page's content area. The popover has a
// fixed pixel height and its Send button a fixed size, so the button's centre
// is the popover's corner plus a pixel offset at every frame width.
const PIN_POINT = { x: "40%", y: "66%" };
const SEND_POINT = { x: "calc(82% - 24px)", y: "calc(6% + 36px)" };
const CURSOR_REST = { x: "92%", y: "96%" };

const ARIA_LABEL =
  "Animation showing a client typing a comment in the feedback widget on a website and sending it. On the Trello board beside it, a new card drops into the New list with the Screenshot as its cover, then the page URL, the console logs and the Recording link appear on the card.";

const HIDDEN = "opacity: 0; transform: translateY(4px);";
const SHOWN = "opacity: 1; transform: none;";

// Classes that end the cycle shown, and the one-off flashes, so the
// reduced-motion block can freeze each on its final state.
const enterClasses: string[] = [];
const flashClasses: string[] = [];

// Shown from `at` until the reset.
function enter(name: string, at: number, hidden = HIDDEN, fade = FADE) {
  enterClasses.push(name);
  return `@keyframes ${name} {
  0%, ${at}% { ${hidden} }
  ${at + fade}%, ${RESET}% { ${SHOWN} }
  ${RESET + FADE}%, 100% { ${hidden} }
}
.${name} { opacity: 0; animation: ${name} ${CYCLE}s ease-out infinite; }`;
}

// A brief highlight at `at`.
function flash(name: string, at: number, extra = "") {
  flashClasses.push(name);
  return `@keyframes ${name} {
  0%, ${at}% { opacity: 0; ${extra} }
  ${at + 1}% { opacity: 1; }
  ${at + 7}%, 100% { opacity: 0; }
}
.${name} { opacity: 0; animation: ${name} ${CYCLE}s ease-out infinite; }`;
}

function rippleKeyframes() {
  return [PIN, SEND]
    .map(
      (at, i) => `@keyframes tha-ripple-${i} {
  0%, ${at - 0.5}% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
  ${at}% { opacity: 1; transform: translate(-50%, -50%) scale(0.3); }
  ${at + 5}%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(1.6); }
}
.tha-ripple-${i} { opacity: 0; animation: tha-ripple-${i} ${CYCLE}s ease-out infinite; }`,
    )
    .join("\n");
}

function cursorKeyframes() {
  const at = (point: { x: string; y: string }) =>
    `left: ${point.x}; top: ${point.y};`;
  return `@keyframes tha-cursor {
  0% { opacity: 0; ${at(CURSOR_REST)} }
  1.5% { opacity: 1; ${at(CURSOR_REST)} }
  ${PIN}%, ${TYPE_START}% { opacity: 1; ${at(PIN_POINT)} }
  ${SEND - 3}%, ${SEND + 2}% { opacity: 1; ${at(SEND_POINT)} }
  ${POPOVER_OUT + 2}% { opacity: 0; ${at(CURSOR_REST)} }
  100% { opacity: 0; ${at(CURSOR_REST)} }
}
.tha-cursor { opacity: 0; animation: tha-cursor ${CYCLE}s ease-in-out infinite; }`;
}

function partKeyframes() {
  return Array.from({ length: CARD_PARTS.length }, (_, i) =>
    enter(
      `tha-part-${i}`,
      PARTS_START + i * PART_STAGGER,
      "opacity: 0; transform: translateX(-4px);",
    ),
  ).join("\n");
}

const CARD_PARTS = [
  {
    icon: LinkIcon,
    label: <span className="truncate text-foreground">/pricing</span>,
  },
  {
    icon: TerminalIcon,
    label: (
      <>
        <span className="truncate text-foreground">Logs</span>
        <span className="rounded-[3px] bg-destructive/15 px-1 font-medium text-destructive">
          2
        </span>
      </>
    ),
  },
  {
    icon: PlayIcon,
    label: (
      <span className="truncate font-medium text-blue-600 dark:text-blue-400">
        Recording
      </span>
    ),
  },
] as const;

const styles = `
${rippleKeyframes()}
${cursorKeyframes()}
${partKeyframes()}
${enter("tha-pin", PIN, "opacity: 0; transform: scale(0.4);")}
${enter("tha-sent", SEND + 1, "opacity: 0; transform: scale(0.6);", 1)}
${enter("tha-count-new", CARD_IN, "opacity: 0; transform: translateY(-3px);")}
${enter("tha-card", CARD_IN + 1, "opacity: 0; transform: translateY(-24px);", 4)}
${flash("tha-glow", CARD_IN + 4)}

@keyframes tha-popover {
  0%, ${POPOVER_IN}% { ${HIDDEN} }
  ${POPOVER_IN + FADE}%, ${POPOVER_OUT}% { ${SHOWN} }
  ${POPOVER_OUT + FADE}%, 100% { opacity: 0; transform: translateY(-4px) scale(0.98); }
}

@keyframes tha-type {
  0%, ${TYPE_START}% { clip-path: inset(0 100% 0 0); animation-timing-function: steps(${COMMENT.length}, end); }
  ${TYPE_END}%, ${POPOVER_OUT + FADE}% { clip-path: inset(0 0 0 0); }
  ${POPOVER_OUT + FADE + 1}%, 100% { clip-path: inset(0 100% 0 0); }
}

@keyframes tha-send-text {
  0%, ${SEND + 1}% { opacity: 1; }
  ${SEND + 2}%, 100% { opacity: 0; }
}

@keyframes tha-press {
  0%, ${SEND - 0.5}% { transform: none; }
  ${SEND}% { transform: scale(0.9); }
  ${SEND + 1.5}%, 100% { transform: none; }
}

@keyframes tha-count-old {
  0%, ${CARD_IN}% { opacity: 1; transform: none; }
  ${CARD_IN + FADE}%, ${RESET}% { opacity: 0; transform: translateY(3px); }
  ${RESET + FADE}%, 100% { opacity: 1; transform: none; }
}

@keyframes tha-slot {
  0%, ${CARD_IN}% { grid-template-rows: 0fr; }
  ${CARD_IN + 4}%, ${RESET + FADE}% { grid-template-rows: 1fr; }
  ${RESET + FADE + 4}%, 100% { grid-template-rows: 0fr; }
}

.tha-popover { opacity: 0; animation: tha-popover ${CYCLE}s ease-out infinite; }
.tha-type { clip-path: inset(0 100% 0 0); animation: tha-type ${CYCLE}s linear infinite; }
.tha-send-text { animation: tha-send-text ${CYCLE}s ease-out infinite; }
.tha-press { animation: tha-press ${CYCLE}s ease-out infinite; }
.tha-count-old { animation: tha-count-old ${CYCLE}s ease-out infinite; }
.tha-slot { grid-template-rows: 0fr; animation: tha-slot ${CYCLE}s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  ${enterClasses.map((name) => `.${name}`).join(", ")} { animation: none; opacity: 1; transform: none; }
  ${flashClasses.map((name) => `.${name}`).join(", ")}, .tha-cursor, .tha-ripple-0, .tha-ripple-1, .tha-count-old, .tha-send-text { animation: none; opacity: 0; }
  .tha-popover { animation: none; opacity: 1; transform: none; }
  .tha-type { animation: none; clip-path: none; }
  .tha-press { animation: none; }
  .tha-slot { animation: none; grid-template-rows: 1fr; }
}
`;

type TrelloHeroAnimationProps = {
  className?: string;
};

export function TrelloHeroAnimation({ className }: TrelloHeroAnimationProps) {
  return (
    <figure
      aria-label={ARIA_LABEL}
      className={cn(
        "@container relative w-full overflow-hidden rounded-2xl border bg-muted/40",
        className,
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div aria-hidden className="absolute inset-0">
        <MockSite />
        <TrelloBoard />
      </div>
    </figure>
  );
}

function MockSite() {
  return (
    <div className="absolute top-[5%] left-[4%] flex h-[58%] w-[60%] flex-col overflow-hidden rounded-lg border bg-background shadow-sm">
      <div className="flex h-[18px] shrink-0 items-center gap-1 border-b px-2 @[30rem]:h-6">
        <span className="size-1.5 rounded-full bg-foreground/15" />
        <span className="size-1.5 rounded-full bg-foreground/15" />
        <span className="size-1.5 rounded-full bg-foreground/15" />
        <span className="ml-1 truncate rounded-[3px] bg-muted px-1.5 text-[8px] leading-3 text-muted-foreground @[30rem]:text-[10px] @[30rem]:leading-4">
          acme.com/pricing
        </span>
      </div>

      <div className="relative min-h-0 flex-1">
        <div className="absolute top-[8%] left-[6%] h-[6%] w-[16%] rounded-[2px] bg-foreground/20" />
        <div className="absolute top-[9%] right-[6%] flex h-[4%] w-[30%] gap-[8%]">
          <span className="flex-1 rounded-[2px] bg-foreground/10" />
          <span className="flex-1 rounded-[2px] bg-foreground/10" />
          <span className="flex-1 rounded-[2px] bg-foreground/10" />
        </div>
        <div className="absolute top-[24%] left-[6%] h-[8%] w-[58%] rounded-[2px] bg-foreground/15" />
        <div className="absolute top-[36%] left-[6%] h-[5%] w-[40%] rounded-[2px] bg-foreground/10" />
        <HeroImage className="absolute top-[48%] left-[6%] h-[40%] w-[62%] rounded-md" />
        <div className="absolute top-[52%] left-[74%] h-[5%] w-[20%] rounded-[2px] bg-foreground/10" />
        <div className="absolute top-[62%] left-[74%] h-[9%] w-[16%] rounded-[3px] bg-primary/80" />

        <span
          className="tha-pin absolute flex size-3.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-[8px] font-semibold text-primary-foreground shadow ring-2 ring-background"
          style={{ left: PIN_POINT.x, top: PIN_POINT.y }}
        >
          1
        </span>

        <CommentPopover />

        <Ripple index={0} point={PIN_POINT} />
        <Ripple index={1} point={SEND_POINT} />
        <MousePointer2Icon className="tha-cursor absolute z-30 size-4 -translate-x-[3px] -translate-y-[3px] fill-foreground text-background drop-shadow" />
      </div>
    </div>
  );
}

type HeroImageProps = {
  className?: string;
};

// The page's hero image, drawn cropped at its right edge: the bug the client reports.
function HeroImage({ className }: HeroImageProps) {
  return (
    <div
      className={cn(
        "overflow-hidden bg-gradient-to-br from-indigo-400/70 via-violet-400/60 to-sky-300/60 dark:from-indigo-500/50 dark:via-violet-500/40 dark:to-sky-500/30",
        className,
      )}
    >
      <div className="relative size-full">
        <span className="absolute top-[18%] left-[10%] size-[28%] rounded-full bg-background/50" />
        <span className="absolute bottom-0 left-[30%] h-[55%] w-[90%] rounded-t-full bg-background/30" />
      </div>
    </div>
  );
}

function CommentPopover() {
  return (
    // Fixed pixel sizes keep the Send button where SEND_POINT expects it.
    <div className="tha-popover absolute top-[6%] right-[18%] left-[6%] z-20 flex h-12 flex-col justify-between rounded-md border bg-popover p-1.5 shadow-lg">
      <p className="tha-type truncate text-[10px] leading-4 text-popover-foreground @[30rem]:text-xs">
        {COMMENT}
      </p>
      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-[8px] text-muted-foreground @[30rem]:text-[10px]">
          Comment on page
        </span>
        <span className="tha-press relative grid h-4 w-9 shrink-0 place-items-center rounded-[4px] bg-primary text-[8px] font-medium text-primary-foreground @[30rem]:text-[9px]">
          <span className="tha-send-text col-start-1 row-start-1">Send</span>
          <CheckIcon className="tha-sent col-start-1 row-start-1 size-2.5" />
        </span>
      </div>
    </div>
  );
}

type RippleProps = {
  index: number;
  point: { x: string; y: string };
};

function Ripple({ index, point }: RippleProps) {
  return (
    <span
      className={`tha-ripple-${index} absolute z-30 size-6 rounded-full border-2 border-primary/60`}
      style={{ left: point.x, top: point.y }}
    />
  );
}

function TrelloBoard() {
  return (
    <div className="absolute top-[32%] right-[4%] bottom-[5%] z-10 flex w-[62%] flex-col overflow-hidden rounded-lg bg-gradient-to-br from-blue-600 to-sky-500 shadow-lg @[30rem]:top-[34%] dark:from-blue-950 dark:to-sky-900">
      <div className="flex h-5 shrink-0 items-center gap-1 bg-black/15 px-2 @[30rem]:h-7">
        <TrelloIcon className="size-2.5 shrink-0 text-white @[30rem]:size-3.5" />
        <span className="truncate text-[9px] font-medium text-white @[30rem]:text-xs">
          Acme website
        </span>
        <span className="ml-auto flex shrink-0 -space-x-1">
          <span className="size-2.5 rounded-full bg-amber-300 ring-1 ring-white/60 @[30rem]:size-3.5" />
          <span className="size-2.5 rounded-full bg-violet-300 ring-1 ring-white/60 @[30rem]:size-3.5" />
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 items-start gap-1.5 p-1.5 @[30rem]:grid-cols-3 @[30rem]:gap-2 @[30rem]:p-2">
        <BoardList title="New" count={<NewCount />}>
          <NewCard />
          <PlaceholderCard
            label="bg-amber-400"
            lines={["w-[80%]", "w-[50%]"]}
          />
          <PlaceholderCard label="bg-violet-400" lines={["w-[65%]"]} />
        </BoardList>
        <BoardList title="In progress" count="2">
          <PlaceholderCard
            label="bg-sky-400"
            lines={["w-[75%]", "w-[45%]"]}
            cover
          />
          <PlaceholderCard label="bg-amber-400" lines={["w-[60%]"]} />
        </BoardList>
        <BoardList title="Done" count="5" className="hidden @[30rem]:flex">
          <PlaceholderCard
            label="bg-violet-400"
            lines={["w-[70%]", "w-[40%]"]}
          />
          <PlaceholderCard label="bg-sky-400" lines={["w-[55%]"]} />
          <PlaceholderCard label="bg-amber-400" lines={["w-[80%]"]} />
        </BoardList>
      </div>
    </div>
  );
}

type BoardListProps = {
  title: string;
  count: ReactNode;
  children: ReactNode;
  className?: string;
};

function BoardList({ title, count, children, className }: BoardListProps) {
  return (
    <div
      className={cn(
        "flex max-h-full min-w-0 flex-col overflow-hidden rounded-md bg-muted p-1 shadow-sm @[30rem]:p-1.5",
        className,
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-1 px-0.5 text-[8px] leading-3 font-semibold text-foreground @[30rem]:text-[10px] @[30rem]:leading-4">
        <span className="truncate">{title}</span>
        <span className="font-normal text-muted-foreground">{count}</span>
      </div>
      {children}
    </div>
  );
}

function NewCount() {
  return (
    <span className="grid">
      <span className="tha-count-old col-start-1 row-start-1">2</span>
      <span className="tha-count-new col-start-1 row-start-1">3</span>
    </span>
  );
}

function NewCard() {
  return (
    <div className="tha-slot grid shrink-0">
      <div className="min-h-0 overflow-hidden">
        <div className="pb-1 @[30rem]:pb-1.5">
          <div className="tha-card relative flex flex-col gap-1 rounded-[4px] bg-card p-1 shadow-sm ring-1 ring-foreground/5 @[30rem]:gap-1.5 @[30rem]:p-1.5">
            <ScreenshotCover />
            <span className="h-1 w-5 rounded-full bg-rose-400 @[30rem]:h-1.5 @[30rem]:w-7" />
            <p className="truncate text-[9px] leading-3 font-medium text-card-foreground @[30rem]:text-[11px] @[30rem]:leading-4">
              {COMMENT.slice(0, -1)}
            </p>
            <ul className="flex flex-col gap-0.5 text-[8px] leading-[11px] text-muted-foreground @[30rem]:gap-1 @[30rem]:text-[10px] @[30rem]:leading-[14px]">
              {CARD_PARTS.map(({ icon: Icon, label }, i) => (
                <li
                  key={i}
                  className={`tha-part-${i} flex min-w-0 items-center gap-1`}
                >
                  <Icon className="size-2 shrink-0 @[30rem]:size-2.5" />
                  {label}
                </li>
              ))}
            </ul>
            <span className="tha-glow pointer-events-none absolute inset-0 rounded-[4px] ring-2 ring-blue-500/70 ring-inset" />
          </div>
        </div>
      </div>
    </div>
  );
}

// A thumbnail of the mock page, pin included: the Screenshot attached as the card cover.
function ScreenshotCover() {
  return (
    <div className="relative aspect-[16/7] w-full overflow-hidden rounded-[3px] border bg-background">
      <span className="absolute top-[12%] left-[6%] h-[7%] w-[14%] rounded-[1px] bg-foreground/20" />
      <span className="absolute top-[28%] left-[6%] h-[9%] w-[50%] rounded-[1px] bg-foreground/15" />
      <HeroImage className="absolute top-[48%] left-[6%] h-[40%] w-[56%] rounded-[2px]" />
      <span className="absolute top-[52%] left-[70%] h-[12%] w-[18%] rounded-[1px] bg-primary/70" />
      <span className="absolute top-[64%] left-[36%] size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-1 ring-background" />
    </div>
  );
}

type PlaceholderCardProps = {
  label: string;
  lines: string[];
  cover?: boolean;
};

function PlaceholderCard({
  label,
  lines,
  cover = false,
}: PlaceholderCardProps) {
  return (
    <div className="mb-1 flex shrink-0 flex-col gap-1 rounded-[4px] bg-card p-1 shadow-sm ring-1 ring-foreground/5 @[30rem]:mb-1.5 @[30rem]:p-1.5">
      {cover ? (
        <span className="aspect-[16/7] w-full rounded-[3px] bg-gradient-to-br from-amber-200 to-rose-200 dark:from-amber-500/30 dark:to-rose-500/30" />
      ) : null}
      <span className={cn("h-1 w-5 rounded-full @[30rem]:w-7", label)} />
      {lines.map((width) => (
        <span
          key={width}
          className={cn(
            "h-1 rounded-full bg-foreground/15 @[30rem]:h-1.5",
            width,
          )}
        />
      ))}
    </div>
  );
}
