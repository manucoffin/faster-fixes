import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import { JiraIcon } from "@workspace/ui/components/icons/jira-icon";
import { LinearIcon } from "@workspace/ui/components/icons/linear-icon";
import { cn } from "@workspace/ui/lib/utils";
import {
  ArrowRightIcon,
  CircleCheckIcon,
  CircleDotIcon,
  CodeIcon,
  CrosshairIcon,
  ImageIcon,
  MonitorIcon,
  PaperclipIcon,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

const CYCLE = 12;

// Percentages of the cycle: the feedback fans out to three trackers, the
// GitHub issue closes and resolves the feedback, then the other two follow.
const CARD = 2;
const STUB_FILL = 8;
const ROW_FILL = 10;
// Time the fill takes to cross one row of the trunk.
const ROW_STEP = 3;
const RETURN = 38;
const RESOLVED = 43;
const FOLLOW = 58;
const RESET = 92;

// Length of a fade in or out, in percentages of the cycle.
const FADE = 2;
// Time a dot takes to cross half a row of the trunk.
const HOP = 1;
// Time a dot takes to cross a branch.
const BRANCH = 2;

const HIDDEN = "opacity: 0; transform: translateY(4px);";
const SHOWN = "opacity: 1; transform: none;";

// Classes grouped by the state the reduced-motion block freezes them on.
const enterClasses: string[] = [];
const leaveClasses: string[] = [];
const growClasses: string[] = [];
const hiddenClasses: string[] = [];

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

// Shown from the start of the cycle until `at`.
function leave(name: string, at: number) {
  leaveClasses.push(name);
  return `@keyframes ${name} {
  0%, ${at}% { opacity: 1; }
  ${at + 1}%, 100% { opacity: 0; }
}
.${name} { animation: ${name} ${CYCLE}s ease-out infinite; }`;
}

// Shown between `from` and `to` only.
function during(name: string, from: number, to: number) {
  hiddenClasses.push(name);
  return `@keyframes ${name} {
  0%, ${from}% { ${HIDDEN} }
  ${from + FADE}%, ${to}% { ${SHOWN} }
  ${to + FADE}%, 100% { opacity: 0; transform: none; }
}
.${name} { opacity: 0; animation: ${name} ${CYCLE}s ease-out infinite; }`;
}

// A brief highlight at `at`.
function flash(name: string, at: number) {
  hiddenClasses.push(name);
  return `@keyframes ${name} {
  0%, ${at}% { opacity: 0; }
  ${at + 1}% { opacity: 1; }
  ${at + 7}%, 100% { opacity: 0; }
}
.${name} { opacity: 0; animation: ${name} ${CYCLE}s ease-out infinite; }`;
}

type Axis = "X" | "Y";

// A connector filling along its axis from `at`.
function grow(name: string, at: number, duration: number, axis: Axis) {
  growClasses.push(name);
  return `@keyframes ${name} {
  0%, ${at}% { opacity: 1; transform: scale${axis}(0); }
  ${at + duration}%, ${RESET}% { opacity: 1; transform: scale${axis}(1); }
  ${RESET + FADE}%, 100% { opacity: 0; transform: scale${axis}(1); }
}
.${name} { transform: scale${axis}(0); animation: ${name} ${CYCLE}s ease-in-out infinite; }`;
}

type Dot = {
  at: number;
  duration: number;
  // Inward dots travel up the trunk and left along a branch: a status change
  // coming back from a tracker.
  inward: boolean;
};

// A status dot travelling along a connector between `at` and `at + duration`.
function travel(name: string, axis: Axis, { at, duration, inward }: Dot) {
  hiddenClasses.push(name);
  const property = axis === "Y" ? "top" : "left";
  const [from, to] = inward ? ["100%", "0%"] : ["0%", "100%"];
  return `@keyframes ${name} {
  0%, ${at}% { opacity: 0; ${property}: ${from}; }
  ${at + 0.3}% { opacity: 1; }
  ${at + duration}% { opacity: 1; ${property}: ${to}; }
  ${at + duration + 0.3}%, 100% { opacity: 0; ${property}: ${to}; }
}
.${name} { opacity: 0; animation: ${name} ${CYCLE}s linear infinite; }`;
}

type Segment = {
  name: string;
  axis: Axis;
  fillAt: number;
  fillDuration: number;
  dots: Dot[];
};

// When each row's branch is reached by the create fill, and by the status dot
// that flows out once the feedback is resolved.
const branchFillAt = (row: number) => ROW_FILL + row * ROW_STEP + ROW_STEP / 2;
const followAt = (row: number) => FOLLOW + 1.5 + HOP * (row * 2 + 1);

const STUB: Segment = {
  name: "tws-stub",
  axis: "Y",
  fillAt: STUB_FILL,
  fillDuration: FADE,
  dots: [
    { at: RETURN + BRANCH + HOP, duration: 1.5, inward: true },
    { at: FOLLOW, duration: 1.5, inward: false },
  ],
};

type TrackerStatus = {
  label: string;
  mappingKey: string;
  mappingValue: string;
};

type Tracker = {
  icon: ComponentType<{ className?: string }>;
  issueKey: string;
  title: string;
  project: string;
  before: TrackerStatus;
  after: TrackerStatus;
  // The tracker the sync starts from: its status flows back to the feedback.
  isSource: boolean;
};

const TITLE = "Subscribe button overlaps the footer";

const TRACKERS: Tracker[] = [
  {
    icon: GithubIcon,
    issueKey: "#128",
    title: TITLE,
    project: "acme/website",
    before: { label: "Open", mappingKey: "state", mappingValue: "open" },
    after: { label: "Closed", mappingKey: "state", mappingValue: "closed" },
    isSource: true,
  },
  {
    icon: LinearIcon,
    issueKey: "ENG-42",
    title: TITLE,
    project: "Engineering",
    before: {
      label: "Ready for QA",
      mappingKey: "type",
      mappingValue: "Started",
    },
    after: {
      label: "Released",
      mappingKey: "type",
      mappingValue: "Completed",
    },
    isSource: false,
  },
  {
    icon: JiraIcon,
    issueKey: "WEB-17",
    title: TITLE,
    project: "Website",
    before: {
      label: "To review",
      mappingKey: "category",
      mappingValue: "To Do",
    },
    after: {
      label: "Shipped",
      mappingKey: "category",
      mappingValue: "Done",
    },
    isSource: false,
  },
];

function rowTiming(row: number, isSource: boolean) {
  const branchAt = branchFillAt(row);
  return {
    enterAt: branchAt + BRANCH,
    doneAt: isSource ? RETURN - 2 : followAt(row) + BRANCH,
  };
}

function rowSegments(row: number, isSource: boolean, isLast: boolean) {
  const upperFill = ROW_FILL + row * ROW_STEP;
  const branchAt = branchFillAt(row);
  // The outward status dot passes through every row above its target.
  const outwardHalf = (half: number) => ({
    at: FOLLOW + 1.5 + HOP * (row * 2 + half),
    duration: HOP,
    inward: false,
  });
  const reachesBelow = TRACKERS.slice(row + 1).some(
    (tracker) => !tracker.isSource,
  );

  const upper: Segment = {
    name: `tws-up-${row}`,
    axis: "Y",
    fillAt: upperFill,
    fillDuration: ROW_STEP / 2,
    dots: [
      ...(isSource
        ? [{ at: RETURN + BRANCH, duration: HOP, inward: true }]
        : []),
      outwardHalf(0),
    ],
  };
  const lower: Segment | null = isLast
    ? null
    : {
        name: `tws-down-${row}`,
        axis: "Y",
        fillAt: branchAt,
        fillDuration: ROW_STEP / 2,
        dots: reachesBelow ? [outwardHalf(1)] : [],
      };
  const branch: Segment = {
    name: `tws-branch-${row}`,
    axis: "X",
    fillAt: branchAt,
    fillDuration: BRANCH,
    dots: [
      isSource
        ? { at: RETURN, duration: BRANCH, inward: true }
        : { at: followAt(row), duration: BRANCH, inward: false },
    ],
  };
  return { upper, lower, branch };
}

const ROWS = TRACKERS.map((tracker, row) => ({
  tracker,
  row,
  ...rowTiming(row, tracker.isSource),
  ...rowSegments(row, tracker.isSource, row === TRACKERS.length - 1),
}));

const SEGMENTS = [
  STUB,
  ...ROWS.flatMap(({ upper, lower, branch }) =>
    lower ? [upper, lower, branch] : [upper, branch],
  ),
];

function segmentKeyframes({ name, axis, fillAt, fillDuration, dots }: Segment) {
  return [
    grow(`${name}-fill`, fillAt, fillDuration, axis),
    ...dots.map((dot, i) => travel(`${name}-dot-${i}`, axis, dot)),
  ].join("\n");
}

const STATUS_IN = "opacity: 0; transform: translateY(3px);";

function rowKeyframes({ row, enterAt, doneAt }: (typeof ROWS)[number]) {
  return [
    enter(
      `tws-row-${row}`,
      enterAt,
      "opacity: 0; transform: translateX(6px);",
      3,
    ),
    leave(`tws-before-${row}`, doneAt),
    enter(`tws-after-${row}`, doneAt, STATUS_IN, 1),
    flash(`tws-glow-${row}`, doneAt),
  ].join("\n");
}

type Caption = {
  tag: string;
  isCreate: boolean;
  from: string;
  to: string;
};

const CAPTIONS: Caption[] = [
  {
    tag: "Create",
    isCreate: true,
    from: "FasterFixes",
    to: "GitHub, Linear, Jira",
  },
  {
    tag: "Status",
    isCreate: false,
    from: "GitHub",
    to: "FasterFixes",
  },
  {
    tag: "Status",
    isCreate: false,
    from: "FasterFixes",
    to: "Linear, Jira",
  },
];

const CAPTION_WINDOWS = [
  [STUB_FILL - 4, RETURN - 6],
  [RETURN - 3, FOLLOW - 4],
] as const;

const styles = `
${enter("tws-card", CARD)}
${leave("tws-card-before", RESOLVED)}
${enter("tws-card-after", RESOLVED, STATUS_IN, 1)}
${flash("tws-card-glow", RESOLVED)}
${SEGMENTS.map(segmentKeyframes).join("\n")}
${ROWS.map(rowKeyframes).join("\n")}
${CAPTION_WINDOWS.map(([from, to], i) => during(`tws-caption-${i}`, from, to)).join("\n")}
${enter(`tws-caption-${CAPTIONS.length - 1}`, FOLLOW - 1)}

@media (prefers-reduced-motion: reduce) {
  ${[...enterClasses, ...growClasses].map((name) => `.${name}`).join(", ")} { animation: none; opacity: 1; transform: none; }
  ${[...leaveClasses, ...hiddenClasses].map((name) => `.${name}`).join(", ")} { animation: none; opacity: 0; }
}
`;

type TwoWaySyncAnimationProps = {
  className?: string;
};

export function TwoWaySyncAnimation({ className }: TwoWaySyncAnimationProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "@container flex w-full flex-col gap-3 overflow-hidden rounded-2xl border bg-muted/30 p-3 @[30rem]:gap-4 @[30rem]:p-5",
        className,
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="flex flex-col">
        <FeedbackCard />
        <div className="grid grid-cols-[1.5rem_minmax(0,1fr)]">
          <div className="flex justify-center">
            <span className="relative h-3 w-px bg-border @[30rem]:h-4">
              <SegmentLine segment={STUB} />
            </span>
          </div>
        </div>
        {ROWS.map(({ tracker, row, upper, lower, branch }) => (
          <div
            key={tracker.issueKey}
            className="grid grid-cols-[1.5rem_minmax(0,1fr)]"
          >
            <div className="relative">
              <span className="absolute top-0 left-1/2 h-1/2 w-px bg-border">
                <SegmentLine segment={upper} />
              </span>
              {lower ? (
                <span className="absolute top-1/2 bottom-0 left-1/2 w-px bg-border">
                  <SegmentLine segment={lower} />
                </span>
              ) : null}
              <span className="absolute top-1/2 right-0 left-1/2 h-px bg-border">
                <SegmentLine segment={branch} />
              </span>
            </div>
            <div className="py-1 @[30rem]:py-1.5">
              <TrackerRow tracker={tracker} row={row} />
            </div>
          </div>
        ))}
      </div>

      <SyncCaptions />
    </div>
  );
}

type SegmentLineProps = {
  segment: Segment;
};

function SegmentLine({ segment }: SegmentLineProps) {
  const isVertical = segment.axis === "Y";
  return (
    <>
      <span
        className={cn(
          "absolute inset-0 bg-primary",
          isVertical ? "origin-top" : "origin-left",
          `${segment.name}-fill`,
        )}
      />
      {segment.dots.map((_, i) => (
        <span
          key={i}
          className={cn(
            "absolute z-10 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-success ring-2 ring-background",
            isVertical ? "left-1/2" : "top-1/2",
            `${segment.name}-dot-${i}`,
          )}
        />
      ))}
    </>
  );
}

const REPORT_CHIPS = [
  { icon: ImageIcon, label: "Screenshot", className: "" },
  { icon: CodeIcon, label: "Footer/SubscribeButton", className: "" },
  { icon: CrosshairIcon, label: "button.subscribe", className: "" },
  {
    icon: MonitorIcon,
    label: "Chrome · 1440×900",
    className: "hidden @[30rem]:flex",
  },
] as const;

function FeedbackCard() {
  return (
    <div className="tws-card relative flex flex-col gap-2 rounded-lg border bg-background p-2.5 shadow-sm @[30rem]:p-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex size-4 shrink-0 items-center justify-center rounded-[4px] bg-primary text-[8px] font-semibold text-primary-foreground">
          FF
        </span>
        <span className="truncate text-[10px] text-muted-foreground @[30rem]:text-[11px]">
          Feedback · acme.com/pricing
        </span>
        <span className="ml-auto grid shrink-0">
          <StatusPill className="tws-card-before" isDone={false}>
            Open
          </StatusPill>
          <StatusPill className="tws-card-after" isDone>
            Resolved
          </StatusPill>
        </span>
      </div>
      <p className="truncate text-[11px] leading-snug font-medium text-foreground @[30rem]:text-xs">
        {TITLE}
      </p>
      <ul className="flex flex-wrap gap-1 @[30rem]:gap-1.5">
        {REPORT_CHIPS.map(({ icon: Icon, label, className }) => (
          <li
            key={label}
            className={cn(
              "flex min-w-0 items-center gap-1 rounded-md border bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] leading-4 text-foreground @[30rem]:text-[11px]",
              className,
            )}
          >
            <Icon className="size-3 shrink-0 text-muted-foreground" />
            <span className="truncate">{label}</span>
          </li>
        ))}
      </ul>
      <span className="tws-card-glow pointer-events-none absolute inset-0 rounded-lg ring-2 ring-success/60 ring-inset" />
    </div>
  );
}

type StatusPillProps = {
  isDone: boolean;
  className?: string;
  children: ReactNode;
};

// Pills sharing a grid cell cross-fade in place, at the width of the widest.
function StatusPill({ isDone, className, children }: StatusPillProps) {
  const Icon = isDone ? CircleCheckIcon : CircleDotIcon;
  return (
    <span
      className={cn(
        "col-start-1 row-start-1 flex items-center gap-1 justify-self-end rounded-full border px-1.5 text-[10px] leading-4 font-medium whitespace-nowrap @[30rem]:text-[11px]",
        isDone
          ? "border-success/30 bg-success/10 text-success"
          : "bg-background text-foreground",
        className,
      )}
    >
      <Icon
        className={cn(
          "size-2.5 shrink-0",
          isDone ? "text-success" : "text-muted-foreground",
        )}
      />
      {children}
    </span>
  );
}

type TrackerRowProps = {
  tracker: Tracker;
  row: number;
};

function TrackerRow({ tracker, row }: TrackerRowProps) {
  const { icon: Icon, issueKey, title, project, before, after } = tracker;
  return (
    <div
      className={cn(
        `tws-row-${row}`,
        "relative flex min-w-0 flex-col gap-1 rounded-lg border bg-background px-2 py-1.5 shadow-sm @[30rem]:px-2.5 @[30rem]:py-2",
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <Icon className="size-3 shrink-0 text-foreground" />
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground @[30rem]:text-[11px]">
          {issueKey}
        </span>
        <span className="min-w-0 truncate text-[11px] leading-snug font-medium text-foreground @[30rem]:text-xs">
          {title}
        </span>
      </div>
      <div className="flex min-w-0 items-center gap-1.5 text-[10px] text-muted-foreground @[30rem]:text-[11px]">
        <span className="grid shrink-0">
          <StatusPill className={`tws-before-${row}`} isDone={false}>
            {before.label}
          </StatusPill>
          <StatusPill className={`tws-after-${row}`} isDone>
            {after.label}
          </StatusPill>
        </span>
        <span className="grid min-w-0">
          <Mapping className={`tws-before-${row}`} status={before} />
          <Mapping className={`tws-after-${row}`} status={after} />
        </span>
        <span className="ml-auto hidden shrink-0 items-center gap-1 @[24rem]:flex">
          <PaperclipIcon className="size-3 shrink-0" />
          <span className="truncate">{project}</span>
        </span>
      </div>
      <span
        className={cn(
          `tws-glow-${row}`,
          "pointer-events-none absolute inset-0 rounded-lg ring-2 ring-success/60 ring-inset",
        )}
      />
    </div>
  );
}

type MappingProps = {
  status: TrackerStatus;
  className?: string;
};

// The tracker's own state type or category, which is what the sync maps.
function Mapping({ status, className }: MappingProps) {
  return (
    <span
      className={cn(
        "col-start-1 row-start-1 truncate font-mono text-[9px] @[30rem]:text-[10px]",
        className,
      )}
    >
      {status.mappingKey}:{" "}
      <span className="text-foreground/80">{status.mappingValue}</span>
    </span>
  );
}

function SyncCaptions() {
  return (
    <div className="grid justify-items-center">
      {CAPTIONS.map(({ tag, isCreate, from, to }, i) => (
        <span
          key={`${from}-${to}`}
          className={cn(
            `tws-caption-${i}`,
            "col-start-1 row-start-1 inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-[10px] font-medium text-foreground @[30rem]:text-xs",
          )}
        >
          <span
            className={cn(
              "shrink-0 rounded-full px-1.5 text-[9px] leading-4 @[30rem]:text-[10px]",
              isCreate
                ? "bg-primary/10 text-primary"
                : "bg-success/10 text-success",
            )}
          >
            {tag}
          </span>
          <span className="truncate">{from}</span>
          <ArrowRightIcon className="size-3 shrink-0 text-muted-foreground" />
          <span className="truncate">{to}</span>
        </span>
      ))}
    </div>
  );
}
