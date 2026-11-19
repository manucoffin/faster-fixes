import type { ReactNode } from "react";
import { cn } from "@workspace/ui/lib/utils";
import {
  ClaudeCodeInput,
  ClaudeCodeWelcome,
} from "../../../(home)/_features/context/context-illustrations";
import { TerminalFrame } from "../../../(home)/_features/how-it-works/flow-animations";

const CYCLE = 12;

// Percentages of the cycle: the export lands, the agent is asked to import
// it, calls create_feedbacks, and the board fills with the old dates.
const FILE = 2;
const PROMPT = 8;
const CALL = 16;
const CALL_OUT = 30;
const CARD_STEP = 6;
const CARDS = 36;
const NOTE = 56;
const RESET = 92;

const FADE = 4;

const SHOWN = "opacity: 1; transform: none;";
const HIDDEN = "opacity: 0; transform: translateY(4px);";

const STEPS = [
  { name: "file", from: FILE },
  { name: "prompt", from: PROMPT },
  { name: "call", from: CALL },
  { name: "call-out", from: CALL_OUT },
  { name: "card-0", from: CARDS },
  { name: "card-1", from: CARDS + CARD_STEP },
  { name: "card-2", from: CARDS + CARD_STEP * 2 },
  { name: "note", from: NOTE },
] as const;

type StepName = (typeof STEPS)[number]["name"];

function stepKeyframes({ name, from }: (typeof STEPS)[number]) {
  return `@keyframes vsi-${name} {
  0%, ${from}% { ${HIDDEN} }
  ${from + FADE}%, ${RESET}% { ${SHOWN} }
  100% { opacity: 0; transform: none; }
}
.vsi-${name} { ${HIDDEN} animation: vsi-${name} ${CYCLE}s ease infinite; }`;
}

const stepSelectors = STEPS.map(({ name }) => `.vsi-${name}`).join(", ");

// The terminal is scoped to the dark theme, so these resolve to its values.
const styles = `
${STEPS.map(stepKeyframes).join("\n")}
@keyframes vsi-dot {
  0%, ${CALL_OUT - 1}% { color: var(--color-muted-foreground); }
  ${CALL_OUT}%, 100% { color: var(--color-success); }
}
.vsi-dot { color: var(--color-muted-foreground); animation: vsi-dot ${CYCLE}s step-end infinite; }

@media (prefers-reduced-motion: reduce) {
  ${stepSelectors} { animation: none; ${SHOWN} }
  .vsi-dot { animation: none; color: var(--color-success); }
}
`;

const REVIEWER = "Sarah Chen";

const IMPORTED_ITEMS = [
  {
    step: "card-0",
    title: "Logo overlaps the menu on mobile",
    date: "Mar 14, 2025",
  },
  {
    step: "card-1",
    title: "Typo in the pricing footnote",
    date: "Mar 12, 2025",
  },
  {
    step: "card-2",
    title: "Contact form button misaligned",
    date: "Feb 27, 2025",
  },
] as const;

type StepProps = {
  step: StepName;
  className?: string;
  children: ReactNode;
};

function Step({ step, className, children }: StepProps) {
  return <div className={cn(`vsi-${step}`, className)}>{children}</div>;
}

type ExportFileProps = {
  fileName: string;
  exportFormats: string[];
};

function ExportFile({ fileName, exportFormats }: ExportFileProps) {
  return (
    <Step
      step="file"
      className="flex min-w-0 items-center gap-2 self-start rounded-lg border bg-background px-2.5 py-1.5 shadow-xs"
    >
      <FileGlyph />
      <span className="min-w-0 truncate font-mono text-[10px] text-foreground sm:text-xs">
        {fileName}
      </span>
      <span className="flex shrink-0 gap-1">
        {exportFormats.map((format, index) => (
          <span
            key={format}
            className={cn(
              "rounded-[3px] border px-1 font-mono text-[8px] leading-[14px] sm:text-[9px]",
              index === 0
                ? "border-foreground/20 bg-muted text-foreground"
                : "text-muted-foreground",
            )}
          >
            {format}
          </span>
        ))}
      </span>
    </Step>
  );
}

function FileGlyph() {
  return (
    <span className="relative flex h-4 w-3 shrink-0 flex-col justify-end gap-[2px] rounded-[2px] border border-foreground/30 px-[2px] pb-[3px]">
      <span className="h-px w-full bg-foreground/30" />
      <span className="h-px w-full bg-foreground/30" />
      <span className="h-px w-2/3 bg-foreground/30" />
    </span>
  );
}

type ArgProps = {
  name: string;
  value: string;
};

function Arg({ name, value }: ArgProps) {
  return (
    <span className="truncate">
      <span className="text-muted-foreground">{name}:</span>{" "}
      <span className="text-foreground/90">{value}</span>
    </span>
  );
}

type AgentSessionProps = {
  fileName: string;
};

function AgentSession({ fileName }: AgentSessionProps) {
  return (
    <TerminalFrame
      title="~/yourapp"
      contentClassName="dark flex flex-col gap-2 px-2.5 pt-2 pb-2.5 font-mono text-[9px] leading-normal sm:gap-3 sm:px-4 sm:pb-4 sm:text-[11px] sm:leading-relaxed"
    >
      <ClaudeCodeWelcome />

      <div className="flex min-w-0 flex-col gap-1.5 sm:gap-2">
        <Step
          step="prompt"
          className="flex min-w-0 gap-2 text-muted-foreground"
        >
          <span className="shrink-0">&gt;</span>
          <span className="truncate">
            Import the open items from{" "}
            <span className="text-foreground">@{fileName}</span>
          </span>
        </Step>

        <Step step="call" className="flex min-w-0 flex-col">
          <div className="flex min-w-0 gap-2">
            <span className="vsi-dot shrink-0">⏺</span>
            <span className="min-w-0 truncate text-foreground">
              <span className="font-semibold">
                faster-fixes - create_feedbacks
              </span>{" "}
              <span className="text-muted-foreground">(MCP)</span>
            </span>
          </div>
          <div className="flex min-w-0 flex-col pl-4 sm:pl-5">
            <Arg name="items" value="100" />
            <Arg name="createdAt" value={`"2025-03-14"`} />
            <Arg name="reviewer" value={`"${REVIEWER}"`} />
          </div>
        </Step>

        <Step step="call-out" className="flex min-w-0 gap-2 pl-3 sm:pl-4">
          <span className="shrink-0 text-muted-foreground/60">⎿</span>
          <span className="truncate text-success">
            100 Feedbacks created, original dates kept.
          </span>
        </Step>
      </div>

      <ClaudeCodeInput />
    </TerminalFrame>
  );
}

type ImportedCardProps = {
  step: StepName;
  title: string;
  date: string;
};

function ImportedCard({ step, title, date }: ImportedCardProps) {
  return (
    <Step
      step={step}
      className="flex flex-col gap-1 rounded-lg border bg-card px-2 py-1.5 shadow-xs"
    >
      <span className="truncate text-[10px] leading-tight text-card-foreground sm:text-[11px]">
        {title}
      </span>
      <span className="flex min-w-0 items-center gap-1.5 text-[9px] text-muted-foreground sm:text-[10px]">
        <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-muted text-[7px] font-medium text-foreground">
          SC
        </span>
        <span className="truncate">{REVIEWER}</span>
        <span className="ml-auto shrink-0 tabular-nums">{date}</span>
      </span>
    </Step>
  );
}

function FeedbackBoard() {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-background p-2 shadow-sm">
      <div className="flex items-center gap-1.5 px-1 pt-0.5">
        <span className="size-1.5 rounded-full bg-primary" />
        <span className="text-[11px] font-medium text-foreground">New</span>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          100
        </span>
        <Step
          step="note"
          className="ml-auto rounded-full border bg-muted px-1.5 text-[9px] leading-4 text-muted-foreground sm:text-[10px]"
        >
          No GitHub issues opened
        </Step>
      </div>
      <div className="flex flex-col gap-1.5">
        {IMPORTED_ITEMS.map(({ step, title, date }) => (
          <ImportedCard key={title} step={step} title={title} date={date} />
        ))}
      </div>
    </div>
  );
}

type McpImportAnimationProps = {
  competitorName: string;
  exportFormats: string[];
  className?: string;
};

export function McpImportAnimation({
  competitorName,
  exportFormats,
  className,
}: McpImportAnimationProps) {
  const fileName = `${competitorName.toLowerCase().replace(/\s+/g, "-")}-export.csv`;

  return (
    <figure
      aria-hidden
      className={cn("flex w-full min-w-0 flex-col gap-3", className)}
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <ExportFile fileName={fileName} exportFormats={exportFormats} />
      <AgentSession fileName={fileName} />
      <FeedbackBoard />
    </figure>
  );
}
