import { CheckIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@workspace/ui/lib/utils";
import { TerminalFrame } from "../../../../(home)/_features/how-it-works/flow-animations";

const CYCLE = 14;

// Percentages of the cycle: the Usersnap session answers product questions
// and stops at the edit, then the FasterFixes session reads one Feedback
// field by field and closes it.
const USERSNAP_PROMPT = 2;
const USERSNAP_SEARCH = 6;
const USERSNAP_OPPORTUNITY = 14;
const USERSNAP_EDIT = 22;
const FASTER_FIXES_PROMPT = 34;
const FASTER_FIXES_GET = 38;
const FIELDS = 43;
const FIELD_STEP = 3;
const FASTER_FIXES_STATUS = 66;
const RESET = 92;

const FADE = 3;
// A call's output lands this long after its head.
const CALL_LATENCY = 4;

const SHOWN = "opacity: 1; transform: none;";
const HIDDEN = "opacity: 0; transform: translateY(3px);";

const FEEDBACK_ID = "3f9c2a1e";

const CONTEXT_FIELDS = [
  { label: "Selector", value: "button.upgrade", tone: "text-foreground" },
  {
    label: "Component",
    value: "PricingPage › PlanCard",
    tone: "text-foreground",
  },
  { label: "Screenshot", value: "1280 × 720", tone: "text-foreground" },
  { label: "Recording", value: "4.6 s, 6 steps", tone: "text-foreground" },
  {
    label: "Console",
    value: "priceId is undefined",
    tone: "text-destructive",
  },
  {
    label: "Network",
    value: "POST /api/checkout → 500",
    tone: "text-destructive",
  },
] as const;

const STEPS = [
  { name: "u-prompt", from: USERSNAP_PROMPT },
  { name: "u-search", from: USERSNAP_SEARCH },
  { name: "u-search-out", from: USERSNAP_SEARCH + CALL_LATENCY },
  { name: "u-opportunity", from: USERSNAP_OPPORTUNITY },
  { name: "u-opportunity-out", from: USERSNAP_OPPORTUNITY + CALL_LATENCY },
  { name: "u-edit", from: USERSNAP_EDIT },
  { name: "u-edit-out", from: USERSNAP_EDIT + CALL_LATENCY },
  { name: "f-prompt", from: FASTER_FIXES_PROMPT },
  { name: "f-get", from: FASTER_FIXES_GET },
  ...CONTEXT_FIELDS.map((_, index) => ({
    name: `f-field-${index}`,
    from: FIELDS + index * FIELD_STEP,
  })),
  { name: "f-status", from: FASTER_FIXES_STATUS },
  { name: "f-status-out", from: FASTER_FIXES_STATUS + CALL_LATENCY },
];

// The step dot stays grey while the call runs and turns green when it returns.
const DOTS = [
  { name: "f-get", from: FASTER_FIXES_GET, done: FIELDS },
  {
    name: "f-status",
    from: FASTER_FIXES_STATUS,
    done: FASTER_FIXES_STATUS + CALL_LATENCY,
  },
] as const;

function stepKeyframes({ name, from }: (typeof STEPS)[number]) {
  return `@keyframes usmc-${name} {
  0%, ${from}% { ${HIDDEN} }
  ${from + FADE}%, ${RESET}% { ${SHOWN} }
  100% { opacity: 0; transform: none; }
}
.usmc-${name} { ${HIDDEN} animation: usmc-${name} ${CYCLE}s ease infinite; }`;
}

function dotKeyframes({ name, done }: (typeof DOTS)[number]) {
  return `@keyframes usmc-dot-${name} {
  0%, ${done - 1}% { color: var(--color-muted-foreground); }
  ${done}%, 100% { color: var(--color-success); }
}
.usmc-dot-${name} { color: var(--color-muted-foreground); animation: usmc-dot-${name} ${CYCLE}s step-end infinite; }`;
}

const stepSelectors = STEPS.map(({ name }) => `.usmc-${name}`).join(", ");
const dotSelectors = DOTS.map(({ name }) => `.usmc-dot-${name}`).join(", ");

// The terminals are scoped to the dark theme, so these resolve to its values.
const styles = `
${STEPS.map(stepKeyframes).join("\n")}
${DOTS.map(dotKeyframes).join("\n")}

@media (prefers-reduced-motion: reduce) {
  ${stepSelectors} { animation: none; ${SHOWN} }
  ${dotSelectors} { animation: none; color: var(--color-success); }
}
`;

const SESSION_CLASS_NAME =
  "dark flex flex-col gap-1.5 px-2.5 pt-2 pb-2.5 font-mono text-[9px] leading-normal sm:gap-2 sm:px-4 sm:pb-4 sm:text-[11px] sm:leading-relaxed";

type StepProps = {
  step: string;
  className?: string;
  children: ReactNode;
};

function Step({ step, className, children }: StepProps) {
  return <div className={cn(`usmc-${step}`, className)}>{children}</div>;
}

type PromptProps = {
  step: string;
  children: ReactNode;
};

function Prompt({ step, children }: PromptProps) {
  return (
    <Step step={step} className="flex min-w-0 gap-2 text-muted-foreground">
      <span className="shrink-0">&gt;</span>
      <span className="truncate">{children}</span>
    </Step>
  );
}

type CallHeadProps = {
  step: string;
  server: string;
  tool: string;
  args?: string;
  dotClassName?: string;
  toolClassName?: string;
};

function CallHead({
  step,
  server,
  tool,
  args,
  dotClassName = "text-muted-foreground",
  toolClassName,
}: CallHeadProps) {
  return (
    <Step step={step} className="flex min-w-0 gap-2">
      <span className={cn("shrink-0", dotClassName)}>⏺</span>
      <span className="min-w-0 truncate text-foreground">
        <span className={cn("font-semibold", toolClassName)}>
          {server} - {tool}
        </span>{" "}
        <span className="text-muted-foreground">(MCP){args}</span>
      </span>
    </Step>
  );
}

type CallOutputProps = {
  step: string;
  className?: string;
  children: ReactNode;
};

function CallOutput({ step, className, children }: CallOutputProps) {
  return (
    <Step step={step} className="flex min-w-0 gap-2 pl-3 sm:pl-4">
      <span className="shrink-0 text-muted-foreground/60">⎿</span>
      <span className={cn("min-w-0 truncate", className)}>{children}</span>
    </Step>
  );
}

function UsersnapSession() {
  return (
    <div className="opacity-70">
      <TerminalFrame
        title="usersnap mcp · product analysis"
        contentClassName={SESSION_CLASS_NAME}
      >
        <Prompt step="u-prompt">What are users asking for this month?</Prompt>

        <div className="flex min-w-0 flex-col">
          <CallHead step="u-search" server="usersnap" tool="search feedback" />
          <CallOutput step="u-search-out" className="text-muted-foreground">
            128 items, 3 topics: Onboarding, Billing, Mobile
          </CallOutput>
        </div>

        <div className="flex min-w-0 flex-col">
          <CallHead
            step="u-opportunity"
            server="usersnap"
            tool="create opportunity"
          />
          <CallOutput
            step="u-opportunity-out"
            className="text-muted-foreground"
          >
            Opportunity &quot;Mobile navigation&quot; created.
          </CallOutput>
        </div>

        <div className="flex min-w-0 flex-col">
          <CallHead
            step="u-edit"
            server="usersnap"
            tool="edit feedback"
            dotClassName="text-destructive"
            toolClassName="text-muted-foreground line-through"
          />
          <CallOutput step="u-edit-out" className="text-destructive">
            Not supported: feedback cannot be edited.
          </CallOutput>
        </div>
      </TerminalFrame>
    </div>
  );
}

function ContextFields() {
  return (
    <div className="flex min-w-0 gap-2 pl-3 sm:pl-4">
      <span className="shrink-0 text-muted-foreground/60">⎿</span>
      <div className="flex min-w-0 flex-1 flex-col">
        {CONTEXT_FIELDS.map(({ label, value, tone }, index) => (
          <Step
            key={label}
            step={`f-field-${index}`}
            className="flex min-w-0 gap-2"
          >
            <span className="w-[10ch] shrink-0 text-muted-foreground">
              {label}
            </span>
            <span className={cn("min-w-0 truncate", tone)}>{value}</span>
          </Step>
        ))}
      </div>
    </div>
  );
}

function FasterFixesSession() {
  return (
    <TerminalFrame
      title="faster-fixes mcp · fixes"
      contentClassName={SESSION_CLASS_NAME}
    >
      <Prompt step="f-prompt">
        Fix the checkout feedback on{" "}
        <span className="text-foreground">/pricing</span>
      </Prompt>

      <div className="flex min-w-0 flex-col">
        <CallHead
          step="f-get"
          server="faster-fixes"
          tool="get_feedback"
          dotClassName="usmc-dot-f-get"
        />
        <ContextFields />
      </div>

      <div className="flex min-w-0 flex-col">
        <CallHead
          step="f-status"
          server="faster-fixes"
          tool="update_feedback_status"
          args={`(status: "resolved")`}
          dotClassName="usmc-dot-f-status"
        />
        <Step
          step="f-status-out"
          className="flex min-w-0 items-center gap-2 pl-3 sm:pl-4"
        >
          <span className="shrink-0 text-muted-foreground/60">⎿</span>
          <span className="min-w-0 truncate text-success">
            Feedback {FEEDBACK_ID} status updated to &quot;resolved&quot;.
          </span>
          <CheckIcon className="size-3 shrink-0 text-success sm:size-3.5" />
        </Step>
      </div>
    </TerminalFrame>
  );
}

type UsersnapMcpContrastAnimationProps = {
  className?: string;
};

export function UsersnapMcpContrastAnimation({
  className,
}: UsersnapMcpContrastAnimationProps) {
  return (
    <figure
      aria-hidden
      className={cn("flex w-full min-w-0 flex-col gap-3", className)}
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <UsersnapSession />
      <FasterFixesSession />
    </figure>
  );
}
