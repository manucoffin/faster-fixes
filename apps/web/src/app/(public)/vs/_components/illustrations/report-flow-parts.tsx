import { ClaudeCodeIcon } from "@workspace/ui/components/icons/claude-code-icon";
import { CodexIcon } from "@workspace/ui/components/icons/codex-icon";
import { CursorIcon } from "@workspace/ui/components/icons/cursor-icon";
import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import { JiraIcon } from "@workspace/ui/components/icons/jira-icon";
import { LinearIcon } from "@workspace/ui/components/icons/linear-icon";
import { TrelloIcon } from "@workspace/ui/components/icons/trello-icon";
import { cn } from "@workspace/ui/lib/utils";
import {
  ArrowDownUpIcon,
  ArrowLeftRightIcon,
  CheckIcon,
  ComponentIcon,
  CrosshairIcon,
  MessageSquareIcon,
  MonitorIcon,
  PlayIcon,
  SquareTerminalIcon,
  UsersIcon,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

const COMMENT = "The button is cut off on mobile.";

const CONTEXT: {
  label: string;
  Icon: ComponentType<{ className?: string }>;
}[] = [
  { label: "Selector", Icon: CrosshairIcon },
  { label: "Component", Icon: ComponentIcon },
  { label: "Console", Icon: SquareTerminalIcon },
  { label: "Network", Icon: ArrowDownUpIcon },
  { label: "Browser", Icon: MonitorIcon },
  { label: "Replay", Icon: PlayIcon },
];

// Column titles of the project board in the dashboard.
const BOARD = [
  { title: "New", card: "Typo in footer" },
  { title: "In Progress", card: null },
  { title: "Resolved", card: "Logo is blurry" },
];

export function ClientSite() {
  return (
    <Panel className="overflow-hidden">
      <div className="border-b bg-muted/40 px-3 py-2">
        <span className="block truncate rounded-md bg-background px-2 py-1 text-center font-mono text-[10px] text-muted-foreground">
          client-site.com/pricing
        </span>
      </div>

      <div className="relative px-4 pt-4 pb-14">
        <PlanCard />
        <div className="mt-4 rounded-lg border bg-background p-2.5 shadow-md">
          <p className="rounded-md border px-2 py-1.5 text-[11px] text-foreground">
            {COMMENT}
          </p>
          <span className="mt-2 ml-auto block w-fit rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground">
            Submit
          </span>
        </div>
        <span className="absolute right-3 bottom-3 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
          <MessageSquareIcon className="size-4" />
        </span>
      </div>
    </Panel>
  );
}

type PlanCardProps = {
  compact?: boolean;
};

// The flagged element, drawn again at thumbnail size as the report's screenshot.
function PlanCard({ compact = false }: PlanCardProps) {
  return (
    <div
      className={cn("rounded-lg border bg-background", compact ? "p-2" : "p-3")}
    >
      <span
        className={cn(
          "block font-medium text-foreground",
          compact ? "text-[9px]" : "text-xs",
        )}
      >
        Pro plan
      </span>
      <div className={cn("relative", compact ? "mt-1.5" : "mt-3")}>
        <span
          className={cn(
            "block rounded-md bg-foreground text-center font-medium text-background outline-[1.5px] outline-offset-2 outline-primary outline-dashed",
            compact ? "py-0.5 text-[8px]" : "py-1.5 text-[11px]",
          )}
        >
          Start trial
        </span>
        <span
          className={cn(
            "absolute flex items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground shadow-sm ring-2 ring-background",
            compact
              ? "-top-2.5 -right-2 size-3.5 text-[8px]"
              : "-top-3.5 -right-2.5 size-5 text-[10px]",
          )}
        >
          1
        </span>
      </div>
    </div>
  );
}

export function FeedbackCard() {
  return (
    <Panel className="p-3.5">
      <div className="rounded-lg bg-muted/60 px-8 py-5">
        <PlanCard compact />
      </div>
      <p className="mt-3.5 text-xs font-medium text-foreground">{COMMENT}</p>
      <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
        client-site.com/pricing
      </p>
      <ul className="mt-3.5 grid grid-cols-3 gap-1.5 border-t pt-3.5">
        {CONTEXT.map(({ label, Icon }) => (
          <li
            key={label}
            className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1.5 text-[10px] text-foreground"
          >
            <Icon className="size-3 shrink-0 text-muted-foreground" />
            {label}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function TeamLane() {
  return (
    <Panel className="flex h-full flex-col justify-between">
      <LaneHeader
        icons={<UsersIcon className="size-3.5" />}
        label="You or your team"
      />
      <div className="px-3 pt-3 pb-3.5">
        <div className="grid grid-cols-3 gap-1.5">
          {BOARD.map(({ title, card }) => (
            <div key={title} className="rounded-lg bg-muted/60 p-1.5">
              <p className="truncate px-0.5 text-[9px] font-medium text-muted-foreground">
                {title}
              </p>
              <div className="mt-1.5">
                {card ? <BoardCard>{card}</BoardCard> : <FlaggedBoardCard />}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <ArrowLeftRightIcon className="size-3 shrink-0" />
          Synced with
          <span className="ml-0.5 flex items-center gap-1.5 text-foreground">
            <GithubIcon className="size-3" />
            <LinearIcon className="size-3" />
            <JiraIcon className="size-3" />
            <TrelloIcon className="size-3" />
          </span>
        </p>
      </div>
    </Panel>
  );
}

type BoardCardProps = {
  children: ReactNode;
};

function BoardCard({ children }: BoardCardProps) {
  return (
    <p className="truncate rounded-md bg-background px-1.5 py-1.5 text-[9px] text-muted-foreground ring-1 ring-border">
      {children}
    </p>
  );
}

function FlaggedBoardCard() {
  return (
    <div className="rounded-md bg-background px-1.5 py-1.5 shadow-sm ring-1 ring-primary">
      <p className="line-clamp-2 text-[9px] leading-3 font-medium text-foreground">
        {COMMENT}
      </p>
      <span className="mt-1 flex items-center gap-1 text-[8px] text-muted-foreground">
        <GithubIcon className="size-2.5" />
        #142
      </span>
    </div>
  );
}

export function AgentLane() {
  return (
    <Panel className="flex h-full flex-col">
      <LaneHeader
        icons={
          <>
            <ClaudeCodeIcon className="size-3.5" />
            <CursorIcon className="size-3.5" />
            <CodexIcon className="size-3.5" />
          </>
        }
        label="Your coding agent"
        detail="via MCP"
      />
      <div className="flex flex-1 flex-col justify-center gap-1.5 px-3.5 py-3 font-mono text-[10px] leading-4 text-muted-foreground">
        <p className="truncate text-foreground">› fix the new feedback</p>
        <AgentStep>get_feedback</AgentStep>
        <AgentStep>Fix proposed in PricingCard.tsx</AgentStep>
        <div className="mt-1.5 overflow-hidden rounded-md ring-1 ring-border">
          <p className="truncate bg-destructive/10 px-2 py-0.5 text-destructive">
            - {'<Button className="w-full">'}
          </p>
          <p className="truncate bg-success/10 px-2 py-0.5 text-success">
            + {'<Button className="w-full whitespace-normal">'}
          </p>
        </div>
      </div>
    </Panel>
  );
}

type AgentStepProps = {
  children: ReactNode;
};

function AgentStep({ children }: AgentStepProps) {
  return (
    <p className="flex items-center gap-1.5 truncate">
      <CheckIcon className="size-3 shrink-0 text-success" />
      {children}
    </p>
  );
}

type LaneHeaderProps = {
  icons: ReactNode;
  label: string;
  detail?: string;
};

function LaneHeader({ icons, label, detail }: LaneHeaderProps) {
  return (
    <div className="flex items-center gap-2 border-b px-3.5 py-2.5">
      <span className="flex items-center gap-1.5 text-foreground">{icons}</span>
      <span className="text-[11px] font-medium whitespace-nowrap text-foreground">
        {label}
      </span>
      {detail && (
        <span className="ml-auto text-[10px] whitespace-nowrap text-muted-foreground">
          {detail}
        </span>
      )}
    </div>
  );
}

type PanelProps = {
  className?: string;
  children: ReactNode;
};

function Panel({ className, children }: PanelProps) {
  return (
    <div
      className={cn(
        "w-full rounded-xl bg-background shadow-[0_1px_2px_rgb(0_0_0/0.04),0_4px_12px_-4px_rgb(0_0_0/0.08)] ring-1 ring-border",
        className,
      )}
    >
      {children}
    </div>
  );
}
