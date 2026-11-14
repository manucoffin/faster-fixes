import type { ReactNode } from "react";
import {
  ClaudeCodeInput,
  ClaudeCodeWelcome,
} from "../../../../(home)/_features/context/context-illustrations";
import { TerminalFrame } from "../../../../(home)/_features/how-it-works/flow-animations";

const CYCLE = 14;

// Percentages of the cycle. Each tool call shows its head first, then its
// output once the call returns; a call's long output folds into a one-line
// summary when the next call starts, as agent terminals do.
const PROMPT = 2;
const LIST = 8;
const LIST_OUT = 13;
const GET = 26;
const GET_OUT = 31;
const EDIT = 50;
const EDIT_OUT = 55;
const RESOLVED = 68;
const RESOLVED_OUT = 73;
const RESET = 92;

const FADE = 4;
// Taller than any block, in em so it follows the font size.
const MAX_HEIGHT = "12em";

const ZINC_500 = "rgb(113 113 122)";
const EMERALD_400 = "rgb(52 211 153)";

const FEEDBACK_ID = "3f9c2a1e";

const ARIA_LABEL =
  "Animation showing a Claude Code session connected to the Faster Fixes MCP server. The agent calls list_feedbacks and receives the new Feedbacks as markdown, with the page URL, the DOM selector and the comment. It calls get_feedback on one and reads its Screenshot and its Timeline: a click on Upgrade, a failed request to /api/checkout and a console error. It edits src/components/plan-card.tsx, then calls update_feedback_status to mark the Feedback resolved.";

type Block = {
  name: string;
  from: number;
  // Omitted when the block stays until the reset.
  until?: number;
};

const BLOCKS: Block[] = [
  { name: "prompt", from: PROMPT },
  { name: "list", from: LIST },
  { name: "list-out", from: LIST_OUT, until: GET },
  { name: "list-sum", from: GET },
  { name: "get", from: GET },
  { name: "get-out", from: GET_OUT, until: EDIT },
  { name: "get-sum", from: EDIT },
  { name: "edit", from: EDIT },
  { name: "edit-out", from: EDIT_OUT },
  { name: "status", from: RESOLVED },
  { name: "status-out", from: RESOLVED_OUT },
];

// The step dot stays grey while the call runs and turns green when it returns.
const DOTS = [
  { name: "list", from: LIST, done: LIST_OUT },
  { name: "get", from: GET, done: GET_OUT },
  { name: "edit", from: EDIT, done: EDIT_OUT },
  { name: "status", from: RESOLVED, done: RESOLVED_OUT },
] as const;

const SHOWN = `opacity: 1; max-height: ${MAX_HEIGHT};`;
const HIDDEN = "opacity: 0; max-height: 0;";

function blockKeyframes({ name, from, until }: Block) {
  const end =
    until === undefined
      ? `${RESET}% { ${SHOWN} }\n  100% { opacity: 0; max-height: ${MAX_HEIGHT}; }`
      : `${until}% { ${SHOWN} }\n  ${until + FADE}%, 100% { ${HIDDEN} }`;
  return `@keyframes abr-agent-${name} {
  0%, ${from}% { ${HIDDEN} }
  ${from + FADE}% { ${SHOWN} }
  ${end}
}
.abr-agent-${name} { ${HIDDEN} overflow: hidden; animation: abr-agent-${name} ${CYCLE}s ease infinite; }`;
}

function dotKeyframes({ name, from, done }: (typeof DOTS)[number]) {
  return `@keyframes abr-agent-dot-${name} {
  0%, ${from}% { color: ${ZINC_500}; }
  ${done - 1}% { color: ${ZINC_500}; }
  ${done}%, 100% { color: ${EMERALD_400}; }
}
.abr-agent-dot-${name} { color: ${ZINC_500}; animation: abr-agent-dot-${name} ${CYCLE}s step-end infinite; }`;
}

const persistentSelectors = BLOCKS.filter(({ until }) => until === undefined)
  .map(({ name }) => `.abr-agent-${name}`)
  .join(", ");
const foldedSelectors = BLOCKS.filter(({ until }) => until !== undefined)
  .map(({ name }) => `.abr-agent-${name}`)
  .join(", ");
const dotSelectors = DOTS.map(({ name }) => `.abr-agent-dot-${name}`).join(
  ", ",
);

const styles = `
${BLOCKS.map(blockKeyframes).join("\n")}
${DOTS.map(dotKeyframes).join("\n")}

@media (prefers-reduced-motion: reduce) {
  ${persistentSelectors} { animation: none; ${SHOWN} }
  ${foldedSelectors} { animation: none; ${HIDDEN} }
  ${dotSelectors} { animation: none; color: ${EMERALD_400}; }
}
`;

type RevealProps = {
  block: string;
  children: ReactNode;
};

// The outer element folds to zero height, so its spacing lives on the inner one.
function Reveal({ block, children }: RevealProps) {
  return (
    <div className={`abr-agent-${block}`}>
      <div className="pt-1.5 sm:pt-2">{children}</div>
    </div>
  );
}

type StepHeadProps = {
  block: string;
  children: ReactNode;
};

function StepHead({ block, children }: StepHeadProps) {
  return (
    <Reveal block={block}>
      <div className="flex min-w-0 gap-2">
        <span className={`abr-agent-dot-${block} shrink-0`}>⏺</span>
        <span className="min-w-0 truncate text-zinc-200">{children}</span>
      </div>
    </Reveal>
  );
}

type StepOutputProps = {
  block: string;
  children: ReactNode;
};

function StepOutput({ block, children }: StepOutputProps) {
  return (
    <div className={`abr-agent-${block}`}>
      <div className="flex min-w-0 gap-2 pl-3 sm:pl-4">
        <span className="shrink-0 text-zinc-600">⎿</span>
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}

type McpCallProps = {
  tool: string;
  args: string;
};

function McpCall({ tool, args }: McpCallProps) {
  return (
    <>
      <span className="font-semibold">faster-fixes - {tool}</span>{" "}
      <span className="text-zinc-500">(MCP){args}</span>
    </>
  );
}

type FieldProps = {
  label: string;
  children: ReactNode;
};

function Field({ label, children }: FieldProps) {
  return (
    <span className="truncate">
      <span className="font-semibold text-zinc-300">**{label}:**</span>{" "}
      {children}
    </span>
  );
}

type HeadingProps = {
  level: 1 | 2;
  children: ReactNode;
};

function Heading({ level, children }: HeadingProps) {
  return (
    <span className="truncate font-semibold text-zinc-200">
      <span className="text-indigo-400">{"#".repeat(level)}</span> {children}
    </span>
  );
}

function ListOutput() {
  return (
    <StepOutput block="list-out">
      <div className="flex min-w-0 flex-col text-zinc-400">
        <Heading level={1}>Feedback {FEEDBACK_ID}</Heading>
        <Field label="Page URL">https://yourapp.com/pricing</Field>
        <Field label="DOM selector">
          <span className="text-amber-300/90">`button.upgrade`</span>
        </Field>
        <Heading level={2}>What&apos;s wrong</Heading>
        <span className="truncate">Upgrade does nothing on click.</span>
        <Field label="Recording">4.6 s, 6 steps.</Field>
        <span className="truncate text-zinc-600">+ 1 more Feedback</span>
      </div>
    </StepOutput>
  );
}

const TIMELINE = [
  { at: "-4.2 s", text: 'click button "Upgrade"', tone: "text-zinc-400" },
  {
    at: "-4.1 s",
    text: "POST /api/checkout → 500",
    tone: "text-amber-300/90",
  },
  { at: "-4.0 s", text: "error priceId is undefined", tone: "text-red-300" },
  {
    at: "0.0 s",
    text: 'selection button "Upgrade"',
    tone: "text-indigo-300",
  },
] as const;

function ScreenshotThumbnail() {
  return (
    <div className="flex w-16 shrink-0 flex-col gap-1 sm:w-24">
      <div className="flex aspect-[4/3] flex-col gap-1 rounded-[3px] border border-zinc-700 bg-zinc-950 p-1 sm:p-1.5">
        <span className="h-1 w-[55%] rounded-[1px] bg-zinc-700" />
        <div className="flex flex-1 gap-1">
          <div className="flex flex-1 flex-col justify-end rounded-[2px] bg-zinc-800/70 p-0.5">
            <span className="h-1.5 rounded-[1px] bg-zinc-600" />
          </div>
          <div className="flex flex-1 flex-col justify-end rounded-[2px] bg-zinc-800/70 p-0.5">
            <span className="h-1.5 rounded-[1px] bg-zinc-200 ring-1 ring-indigo-400 ring-offset-1 ring-offset-zinc-900" />
          </div>
        </div>
      </div>
      <span className="truncate text-[8px] text-zinc-500 sm:text-[9px]">
        Screenshot
      </span>
    </div>
  );
}

function GetOutput() {
  return (
    <StepOutput block="get-out">
      <div className="flex min-w-0 gap-2 sm:gap-3">
        <ScreenshotThumbnail />
        <div className="flex min-w-0 flex-1 flex-col">
          <Heading level={2}>Timeline</Heading>
          {TIMELINE.map(({ at, text, tone }) => (
            <span key={at} className="flex min-w-0 gap-1.5">
              <span className="w-[6ch] shrink-0 text-right text-zinc-600">
                {at}
              </span>
              <span className={`truncate ${tone}`}>{text}</span>
            </span>
          ))}
        </div>
      </div>
    </StepOutput>
  );
}

function EditOutput() {
  return (
    <StepOutput block="edit-out">
      <span className="truncate rounded-[2px] bg-red-500/10 px-1 text-red-300">
        24 - priceId: plan.id,
      </span>
      <span className="truncate rounded-[2px] bg-emerald-500/10 px-1 text-emerald-300">
        24 + priceId: plan.priceId,
      </span>
    </StepOutput>
  );
}

function AgentSession() {
  return (
    <TerminalFrame
      title="~/yourapp"
      contentClassName="flex min-h-0 flex-1 flex-col gap-2 px-2.5 pt-2 pb-2.5 font-mono text-[9px] leading-normal sm:gap-3 sm:px-4 sm:pb-4 sm:text-[11px] sm:leading-relaxed"
    >
      <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_0.5rem)]">
        {/* At least as tall as the area so lines start at the top, and
            anchored to its bottom once taller, so the welcome box and the
            oldest lines scroll out of view. */}
        <div className="flex min-h-full shrink-0 flex-col">
          <ClaudeCodeWelcome />
          <Reveal block="prompt">
            <div className="flex min-w-0 gap-2 text-zinc-400">
              <span className="shrink-0">&gt;</span>
              <span className="truncate">Fix the new feedback on /pricing</span>
            </div>
          </Reveal>

          <StepHead block="list">
            <McpCall tool="list_feedbacks" args={`(status: "new")`} />
          </StepHead>
          <ListOutput />
          <StepOutput block="list-sum">
            <span className="truncate text-zinc-500">
              2 Feedbacks, as markdown
            </span>
          </StepOutput>

          <StepHead block="get">
            <McpCall
              tool="get_feedback"
              args={`(feedback_id: "${FEEDBACK_ID}…")`}
            />
          </StepHead>
          <GetOutput />
          <StepOutput block="get-sum">
            <span className="truncate text-zinc-500">
              Markdown, Screenshot image, Timeline
            </span>
          </StepOutput>

          <StepHead block="edit">
            <span className="font-semibold">Update</span>
            <span className="text-zinc-400">
              (src/components/plan-card.tsx)
            </span>
          </StepHead>
          <EditOutput />

          <StepHead block="status">
            <McpCall
              tool="update_feedback_status"
              args={`(status: "resolved")`}
            />
          </StepHead>
          <StepOutput block="status-out">
            <span className="truncate text-emerald-400/90">
              Feedback {FEEDBACK_ID}… status updated to &quot;resolved&quot;.
            </span>
          </StepOutput>
        </div>
      </div>
      <ClaudeCodeInput className="shrink-0" />
    </TerminalFrame>
  );
}

export function AgentMcpSessionAnimation() {
  return (
    <div
      role="img"
      aria-label={ARIA_LABEL}
      className="flex aspect-[5/4] w-full flex-col [&>div]:min-h-0 [&>div]:flex-1"
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <AgentSession />
    </div>
  );
}
