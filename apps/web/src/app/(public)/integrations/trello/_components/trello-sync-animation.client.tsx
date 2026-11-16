"use client";

import { TrelloIcon } from "@workspace/ui/components/icons/trello-icon";
import { cn } from "@workspace/ui/lib/utils";
import {
  ArrowRightIcon,
  CheckIcon,
  CircleCheck,
  CircleDashed,
  CircleDot,
  MousePointer2Icon,
} from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

type TrelloList = "new" | "in_progress" | "qa" | "resolved";
type FeedbackStatus = "new" | "in_progress" | "resolved";
type Direction = "trello-to-faster-fixes" | "faster-fixes-to-trello";

type Frame = {
  // How long this frame holds before the next one, in milliseconds.
  hold: number;
  beat: 0 | 1 | 2;
  card: TrelloList;
  feedback: FeedbackStatus;
  isDragging?: boolean;
  isClicking?: boolean;
  isComplete?: boolean;
  syncedSide?: "trello" | "faster-fixes";
  isHidden?: boolean;
};

type Beat = { direction: Direction; note?: string };

const BEATS = [
  { direction: "trello-to-faster-fixes" },
  { direction: "trello-to-faster-fixes", note: "QA is not mapped. No change." },
  { direction: "faster-fixes-to-trello" },
] as const satisfies readonly Beat[];

// One loop of about 12 seconds: a drag into In progress that the feedback
// follows, a drag into the unmapped QA list that changes nothing, then a
// resolve in Faster Fixes that moves and completes the card.
const FRAMES = [
  { hold: 700, beat: 0, card: "new", feedback: "new" },
  { hold: 600, beat: 0, card: "new", feedback: "new", isDragging: true },
  {
    hold: 800,
    beat: 0,
    card: "in_progress",
    feedback: "new",
    isDragging: true,
  },
  { hold: 500, beat: 0, card: "in_progress", feedback: "new" },
  {
    hold: 1400,
    beat: 0,
    card: "in_progress",
    feedback: "in_progress",
    syncedSide: "faster-fixes",
  },
  {
    hold: 600,
    beat: 1,
    card: "in_progress",
    feedback: "in_progress",
    isDragging: true,
  },
  {
    hold: 800,
    beat: 1,
    card: "qa",
    feedback: "in_progress",
    isDragging: true,
  },
  { hold: 2000, beat: 1, card: "qa", feedback: "in_progress" },
  {
    hold: 700,
    beat: 2,
    card: "qa",
    feedback: "in_progress",
    isClicking: true,
  },
  { hold: 800, beat: 2, card: "qa", feedback: "resolved" },
  {
    hold: 500,
    beat: 2,
    card: "resolved",
    feedback: "resolved",
    syncedSide: "trello",
  },
  {
    hold: 1500,
    beat: 2,
    card: "resolved",
    feedback: "resolved",
    isComplete: true,
    syncedSide: "trello",
  },
  {
    hold: 500,
    beat: 2,
    card: "resolved",
    feedback: "resolved",
    isComplete: true,
    isHidden: true,
  },
] as const satisfies readonly Frame[];

// Reduced motion shows where the loop ends: the card resolved on both sides.
const STATIC_FRAME = FRAMES[11];

const TRELLO_LISTS: { id: TrelloList; title: string; fillers: number }[] = [
  { id: "new", title: "New", fillers: 2 },
  { id: "in_progress", title: "In progress", fillers: 1 },
  { id: "qa", title: "QA", fillers: 1 },
  { id: "resolved", title: "Resolved", fillers: 2 },
];

const FEEDBACK_COLUMNS = [
  {
    id: "new",
    title: "New",
    icon: CircleDot,
    iconClassName: "text-blue-500",
    fillers: 2,
  },
  {
    id: "in_progress",
    title: "In Progress",
    icon: CircleDashed,
    iconClassName: "text-amber-500",
    fillers: 1,
  },
  {
    id: "resolved",
    title: "Resolved",
    icon: CircleCheck,
    iconClassName: "text-success",
    fillers: 2,
  },
] as const;

const CARD_TITLE = "Logo shows up too late";

const ARIA_LABEL =
  "Animation showing a Trello board next to the Faster Fixes Kanban. A card dragged to In progress moves the feedback to In progress. A card dropped into QA changes nothing. The feedback resolved in Faster Fixes moves the card to Resolved and marks it complete.";

const MOVE_TRANSITION = {
  type: "spring",
  stiffness: 260,
  damping: 30,
} as const;

type TrelloSyncAnimationProps = {
  className?: string;
};

export function TrelloSyncAnimation({ className }: TrelloSyncAnimationProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { margin: "-10% 0px" });
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  // Remounting the moving cards each loop makes them fade back in at the
  // start instead of flying from Resolved back to New.
  const [loop, setLoop] = useState(0);

  const isAnimated = isInView && !reducedMotion;

  useEffect(() => {
    if (!isAnimated) return;
    const timeout = setTimeout(() => {
      if (index === FRAMES.length - 1) {
        setIndex(0);
        setLoop((value) => value + 1);
      } else {
        setIndex(index + 1);
      }
    }, FRAMES[index]?.hold);
    return () => clearTimeout(timeout);
  }, [index, isAnimated]);

  const frame: Frame = reducedMotion
    ? STATIC_FRAME
    : (FRAMES[index] ?? FRAMES[0]);

  return (
    <figure
      ref={ref}
      aria-label={ARIA_LABEL}
      className={cn(
        "flex w-full flex-col gap-3 overflow-hidden rounded-2xl border bg-muted/30 p-3 sm:p-4 md:gap-4 md:p-6",
        className,
      )}
    >
      <div
        aria-hidden
        className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row md:gap-4"
      >
        <TrelloBoard frame={frame} loop={loop} />
        <FasterFixesBoard frame={frame} loop={loop} />
      </div>
      <SyncCaption beat={frame.beat} />
    </figure>
  );
}

type BoardProps = {
  frame: Frame;
  loop: number;
};

function TrelloBoard({ frame, loop }: BoardProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-gradient-to-br from-sky-600 to-blue-700 shadow-sm md:flex-[4] dark:from-sky-900 dark:to-blue-950">
      <div className="flex shrink-0 items-center gap-1.5 bg-black/15 px-2.5 py-1.5 md:px-3 md:py-2">
        <TrelloIcon className="size-3 text-white/90 md:size-3.5" />
        <span className="text-[10px] font-medium text-white/90 md:text-xs">
          Website feedback
        </span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-4 gap-1.5 p-1.5 md:gap-2 md:p-2.5">
        {TRELLO_LISTS.map((list) => (
          <div
            key={list.id}
            className="flex min-h-0 min-w-0 flex-col gap-1 rounded-md bg-background/90 p-1 md:gap-1.5 md:rounded-lg md:p-1.5"
          >
            <span className="shrink-0 truncate px-0.5 text-[9px] font-semibold text-foreground md:text-[11px]">
              {list.title}
            </span>
            {Array.from({ length: list.fillers }, (_, i) => (
              <TrelloFillerCard
                key={i}
                // Mobile lists have room for one card only
                className={
                  i > 0 || frame.card === list.id ? "hidden md:flex" : undefined
                }
              />
            ))}
            {frame.card === list.id && (
              <TrelloMovingCard key={loop} frame={frame} loop={loop} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

type FillerProps = {
  className?: string;
};

function TrelloFillerCard({ className }: FillerProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col gap-1 rounded-[4px] bg-card px-1 py-1.5 shadow-sm md:rounded-md md:px-1.5 md:py-2",
        className,
      )}
    >
      <span className="h-1 w-[80%] rounded-full bg-muted-foreground/20" />
      <span className="hidden h-1 w-[55%] rounded-full bg-muted-foreground/15 md:block" />
    </div>
  );
}

function TrelloMovingCard({ frame, loop }: BoardProps) {
  const isSynced = frame.syncedSide === "trello";

  return (
    <motion.div
      layoutId={`trello-card-${loop}`}
      // Only the first list fades in: later lists take over mid-flight.
      initial={frame.card === "new" ? { opacity: 0 } : false}
      animate={{
        opacity: frame.isHidden ? 0 : 1,
        rotate: frame.isDragging ? 3 : 0,
        scale: frame.isDragging ? 1.04 : 1,
      }}
      transition={{ layout: MOVE_TRANSITION, duration: 0.3 }}
      className={cn(
        "relative z-10 flex shrink-0 flex-col gap-1 rounded-[4px] bg-card px-1 py-1 shadow-sm ring-primary/50 transition-shadow duration-300 md:rounded-md md:px-1.5 md:py-1.5",
        frame.isDragging && "shadow-lg",
        isSynced && "ring-2",
      )}
    >
      <span className="h-1 w-5 rounded-full bg-violet-500 md:w-7" />
      <span className="flex min-w-0 items-center gap-1">
        {frame.isComplete && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex size-2.5 shrink-0 items-center justify-center rounded-full bg-success md:size-3"
          >
            <CheckIcon className="size-2 text-background" strokeWidth={3} />
          </motion.span>
        )}
        <span className="truncate text-[8px] leading-tight text-foreground md:text-[11px]">
          {CARD_TITLE}
        </span>
      </span>
      {frame.isDragging && <Cursor className="-right-1 -bottom-2" />}
    </motion.div>
  );
}

function FasterFixesBoard({ frame, loop }: BoardProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-background shadow-sm md:flex-[3]">
      <div className="flex shrink-0 items-center gap-2 border-b px-2.5 py-1.5 md:px-3 md:py-2">
        <span className="text-[10px] font-medium text-foreground md:text-xs">
          /ff
        </span>
        <span className="text-[10px] text-muted-foreground md:text-xs">
          Inbox
        </span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-1.5 p-1.5 md:gap-2 md:p-2.5">
        {FEEDBACK_COLUMNS.map((column) => {
          const Icon = column.icon;
          return (
            <div
              key={column.id}
              className="flex min-h-0 min-w-0 flex-col gap-1 md:gap-1.5"
            >
              <span className="flex items-center gap-1 px-0.5 text-[9px] text-muted-foreground md:text-[11px]">
                <Icon
                  className={cn(
                    "size-2.5 shrink-0 md:size-3",
                    column.iconClassName,
                  )}
                />
                <span className="truncate">{column.title}</span>
              </span>
              <div className="flex min-h-0 flex-1 flex-col gap-1 rounded-md bg-muted/50 p-1 md:gap-1.5 md:rounded-lg md:p-1.5">
                {Array.from({ length: column.fillers }, (_, i) => (
                  <FeedbackFillerCard
                    key={i}
                    className={i > 0 ? "hidden md:flex" : undefined}
                  />
                ))}
                {frame.feedback === column.id && (
                  <FeedbackMovingCard key={loop} frame={frame} loop={loop} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FeedbackFillerCard({ className }: FillerProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-[4px] border bg-card px-1 py-1.5 md:rounded-md md:px-1.5 md:py-2",
        className,
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/25 md:size-2" />
      <span className="h-1 w-[70%] rounded-full bg-muted-foreground/20" />
    </div>
  );
}

function FeedbackMovingCard({ frame, loop }: BoardProps) {
  const column =
    FEEDBACK_COLUMNS.find(({ id }) => id === frame.feedback) ??
    FEEDBACK_COLUMNS[0];
  const Icon = column.icon;
  const isSynced = frame.syncedSide === "faster-fixes";

  return (
    <motion.div
      layoutId={`feedback-card-${loop}`}
      initial={frame.feedback === "new" ? { opacity: 0 } : false}
      animate={{
        opacity: frame.isHidden ? 0 : 1,
        scale: frame.isClicking ? 0.97 : 1,
      }}
      transition={{ layout: MOVE_TRANSITION, duration: 0.3 }}
      className={cn(
        "relative z-10 flex shrink-0 items-start gap-1 rounded-[4px] border bg-card px-1 py-1 ring-primary/50 transition-shadow duration-300 md:rounded-md md:px-1.5 md:py-1.5",
        isSynced && "ring-2",
      )}
    >
      <Icon
        className={cn(
          "mt-px size-2.5 shrink-0 md:size-3",
          column.iconClassName,
        )}
      />
      <span className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-[8px] leading-tight text-foreground md:text-[11px]">
          {CARD_TITLE}
        </span>
        <span className="hidden w-fit items-center gap-0.5 rounded border bg-background px-1 text-[9px] text-muted-foreground lg:inline-flex">
          <TrelloIcon className="size-2" />
          Card
        </span>
      </span>
      {frame.isClicking && <Cursor className="right-1 -bottom-2" />}
    </motion.div>
  );
}

type CursorProps = {
  className?: string;
};

function Cursor({ className }: CursorProps) {
  return (
    <motion.span
      initial={{ opacity: 0, x: 6, y: 6 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      className={cn("pointer-events-none absolute z-20", className)}
    >
      <MousePointer2Icon className="size-3.5 fill-foreground text-background drop-shadow md:size-4" />
    </motion.span>
  );
}

type SyncCaptionProps = {
  beat: Frame["beat"];
};

function SyncCaption({ beat }: SyncCaptionProps) {
  const { direction, note }: Beat = BEATS[beat];
  const [from, to] =
    direction === "trello-to-faster-fixes"
      ? ["Trello", "Faster Fixes"]
      : ["Faster Fixes", "Trello"];

  return (
    <figcaption className="flex shrink-0 flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] md:text-xs">
      <motion.span
        key={beat}
        initial={{ opacity: 0, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 font-medium text-foreground"
      >
        {from}
        <ArrowRightIcon
          className={cn(
            "size-3",
            note ? "text-muted-foreground/50" : "text-muted-foreground",
          )}
        />
        <span className={cn(note && "text-muted-foreground line-through")}>
          {to}
        </span>
      </motion.span>
      {note && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground"
        >
          {note}
        </motion.span>
      )}
    </figcaption>
  );
}
