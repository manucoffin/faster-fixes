import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";
import {
  AgentLane,
  ClientSite,
  FeedbackCard,
  TeamLane,
} from "./report-flow-parts";

type ReportFlowIllustrationProps = {
  className?: string;
};

// One report followed end to end. From a 52rem container the three steps sit
// in a row, captions in the first grid row and drawings in the second; below
// it they stack and the connectors turn vertical.
export function ReportFlowIllustration({
  className,
}: ReportFlowIllustrationProps) {
  return (
    <figure aria-hidden className={cn("@container w-full", className)}>
      <div className="grid grid-cols-1 justify-items-center @min-[52rem]:grid-cols-[minmax(0,0.9fr)_2.5rem_minmax(0,1fr)_2.5rem_minmax(0,1.15fr)] @min-[52rem]:grid-rows-[auto_1fr] @min-[52rem]:justify-items-stretch @min-[52rem]:gap-y-6">
        <Step
          number={1}
          caption="Your client flags an issue"
          className="@min-[52rem]:col-start-1"
          contentClassName="@min-[52rem]:self-center"
        >
          <ClientSite />
        </Step>

        <Connector className="@min-[52rem]:col-start-2 @min-[52rem]:row-start-2 @min-[52rem]:self-center" />

        <Step
          number={2}
          caption="It arrives with full context"
          className="@min-[52rem]:col-start-3"
          contentClassName="@min-[52rem]:self-center"
        >
          <FeedbackCard />
        </Step>

        <div className="@min-[52rem]:hidden">
          <Connector />
        </div>
        <ForkConnector className="hidden @min-[52rem]:col-start-4 @min-[52rem]:row-start-2 @min-[52rem]:block" />

        <Step
          number={3}
          caption="Your team or your agent fixes it"
          className="@min-[52rem]:col-start-5"
          contentClassName="grid grid-cols-1 gap-4 @min-[52rem]:grid-rows-2"
        >
          <TeamLane />
          <span className="text-center text-[11px] text-muted-foreground @min-[52rem]:hidden">
            or
          </span>
          <AgentLane />
        </Step>
      </div>
    </figure>
  );
}

type StepProps = {
  number: number;
  caption: string;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
};

// Stacked, a step is one column; in the row it dissolves into the grid so its
// caption and drawing can sit in separate rows.
function Step({
  number,
  caption,
  className,
  contentClassName,
  children,
}: StepProps) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 @min-[52rem]:contents">
      <p
        className={cn(
          "flex items-center gap-2.5 text-sm font-medium text-foreground @min-[52rem]:row-start-1",
          className,
        )}
      >
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background tabular-nums">
          {number}
        </span>
        {caption}
      </p>
      <div
        className={cn("@min-[52rem]:row-start-2", className, contentClassName)}
      >
        {children}
      </div>
    </div>
  );
}

type ConnectorProps = {
  className?: string;
};

function Connector({ className }: ConnectorProps) {
  return (
    <div
      className={cn(
        "relative my-1 h-10 w-px bg-foreground/20 @min-[52rem]:my-0 @min-[52rem]:h-px @min-[52rem]:w-full",
        className,
      )}
    >
      <Arrowhead />
    </div>
  );
}

// Lanes split the row in two equal halves with a 1rem gap, so each branch
// meets its lane at a quarter of the height.
function ForkConnector({ className }: ConnectorProps) {
  const branchOffset = "calc((100% - 1rem) / 4)";

  return (
    <div className={cn("relative self-stretch", className)}>
      <span className="absolute top-1/2 left-0 h-px w-1/2 bg-foreground/20" />
      <span
        className="absolute left-1/2 w-px bg-foreground/20"
        style={{ top: branchOffset, bottom: branchOffset }}
      />
      <span
        className="absolute right-0 left-1/2 h-px bg-foreground/20"
        style={{ top: branchOffset }}
      >
        <Arrowhead />
      </span>
      <span
        className="absolute right-0 left-1/2 h-px bg-foreground/20"
        style={{ bottom: branchOffset }}
      >
        <Arrowhead />
      </span>
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background px-1.5 text-[10px] leading-4 text-muted-foreground ring-1 ring-border">
        or
      </span>
    </div>
  );
}

function Arrowhead() {
  return (
    <span className="absolute bottom-0 left-1/2 size-1.5 -translate-x-1/2 rotate-135 border-t border-r border-foreground/40 @min-[52rem]:top-1/2 @min-[52rem]:right-0 @min-[52rem]:bottom-auto @min-[52rem]:left-auto @min-[52rem]:translate-x-0 @min-[52rem]:-translate-y-1/2 @min-[52rem]:rotate-45" />
  );
}
