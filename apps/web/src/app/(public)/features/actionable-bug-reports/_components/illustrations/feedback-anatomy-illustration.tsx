import { TerminalFrame } from "@/app/(public)/(home)/_features/how-it-works/flow-animations";
import { cn } from "@workspace/ui/lib/utils";

export const CONTEXT_GROUP_KEYS = [
  "page",
  "browser",
  "components",
  "diagnostics",
  "metadata",
] as const;

export type ContextGroupKey = (typeof CONTEXT_GROUP_KEYS)[number];

type Callout = {
  key: ContextGroupKey;
  label: string;
  lines: readonly { text: string; tone?: "error" | "accent" }[];
};

const CALLOUTS: readonly Callout[] = [
  {
    key: "page",
    label: "Page and element",
    lines: [
      { text: "/checkout · button.pay-now", tone: "accent" },
      { text: "click 412, 618 · 1440 × 900" },
    ],
  },
  {
    key: "browser",
    label: "Browser and OS",
    lines: [{ text: "Chrome 131 · macOS 15" }],
  },
  {
    key: "components",
    label: "Component tree",
    lines: [
      { text: "CheckoutForm › PayButton" },
      { text: "src/checkout/pay-button.tsx" },
    ],
  },
  {
    key: "diagnostics",
    label: "Diagnostic Trail",
    lines: [
      { text: "1 error · 12 requests", tone: "error" },
      { text: "POST /api/pay 500 · 240 ms" },
    ],
  },
  {
    key: "metadata",
    label: "Custom metadata",
    lines: [{ text: "plan: pro · release: 2.4.1" }],
  },
];

const ARIA_LABEL =
  "Anatomy of one Feedback in the inbox: the Screenshot of a checkout page with the Selection frame drawn over the pay button, and five labelled callouts for what was captured: the page /checkout and the selector button.pay-now, Chrome 131 on macOS 15, the component tree CheckoutForm then PayButton, a Diagnostic Trail with one error and 12 requests, and Custom metadata with plan pro and release 2.4.1.";

type FeedbackAnatomyIllustrationProps = {
  // The group whose callout stands out. With none, every callout reads at the
  // same weight, which is the no-JS state.
  activeGroup?: ContextGroupKey | null;
  className?: string;
};

export function FeedbackAnatomyIllustration({
  activeGroup = null,
  className,
}: FeedbackAnatomyIllustrationProps) {
  return (
    <div
      role="img"
      aria-label={ARIA_LABEL}
      className={cn("@container grid w-full", className)}
    >
      <TerminalFrame
        title="Inbox · Feedback #24"
        contentClassName="flex min-h-0 flex-1 flex-col gap-2.5 p-3"
      >
        <FeedbackComment />
        <CheckoutScreenshot activeGroup={activeGroup} />
        <ol className="flex flex-col gap-1.5">
          {CALLOUTS.map((callout, i) => (
            <CalloutRow
              key={callout.key}
              callout={callout}
              index={i}
              state={calloutState(callout.key, activeGroup)}
            />
          ))}
        </ol>
      </TerminalFrame>
    </div>
  );
}

type CalloutState = "neutral" | "active" | "dimmed";

function calloutState(
  key: ContextGroupKey,
  activeGroup: ContextGroupKey | null,
): CalloutState {
  if (activeGroup === null) return "neutral";
  return key === activeGroup ? "active" : "dimmed";
}

function FeedbackComment() {
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] leading-4">
      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[8px] text-zinc-400">
        C
      </span>
      <span className="truncate text-zinc-300">
        &quot;The pay button does nothing.&quot;
      </span>
      <span className="ml-auto shrink-0 text-zinc-600">2 min ago</span>
    </div>
  );
}

type ActiveGroupProps = {
  activeGroup: ContextGroupKey | null;
};

function CheckoutScreenshot({ activeGroup }: ActiveGroupProps) {
  const isBrowser = activeGroup === "browser";
  const isComponents = activeGroup === "components";
  const isPage = activeGroup === "page";

  return (
    <div className="relative min-h-24 flex-1 overflow-hidden rounded-md border border-zinc-800 bg-zinc-950">
      {/* Browser chrome */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 flex h-5 items-center gap-1 border-b px-2 motion-safe:transition-colors",
          isBrowser
            ? "border-indigo-400/50 bg-indigo-400/10"
            : "border-zinc-800 bg-zinc-900",
        )}
      >
        <span className="size-1 rounded-full bg-zinc-700" />
        <span className="size-1 rounded-full bg-zinc-700" />
        <span className="size-1 rounded-full bg-zinc-700" />
        <span className="ml-1.5 flex h-3 w-1/2 items-center rounded-full bg-zinc-800 px-1.5">
          <span className="truncate font-mono text-[8px] text-zinc-400">
            yourapp.com/checkout
          </span>
        </span>
      </div>

      {/* Order summary */}
      <span className="absolute top-[24%] left-[6%] h-[5%] w-[22%] rounded-[2px] bg-zinc-700" />
      <span className="absolute top-[36%] left-[6%] h-[3.5%] w-[32%] rounded-[2px] bg-zinc-800" />
      <span className="absolute top-[45%] left-[6%] h-[3.5%] w-[26%] rounded-[2px] bg-zinc-800" />
      <span className="absolute top-[54%] left-[6%] h-[3.5%] w-[30%] rounded-[2px] bg-zinc-800" />

      {/* CheckoutForm */}
      <div
        className={cn(
          "absolute top-[22%] right-[6%] bottom-[8%] left-[46%] rounded-md border motion-safe:transition-colors",
          isComponents
            ? "border-dashed border-indigo-400/70 bg-indigo-400/5"
            : "border-zinc-800 bg-zinc-900/70",
        )}
      >
        <span
          className={cn(
            "absolute -top-2 left-2 rounded-sm bg-zinc-950 px-1 font-mono text-[8px] leading-3 motion-safe:transition-colors",
            isComponents ? "text-indigo-300" : "text-zinc-600",
          )}
        >
          {"<CheckoutForm>"}
        </span>
        <span className="absolute inset-x-[10%] top-[16%] h-[12%] rounded-[3px] border border-zinc-800 bg-zinc-950" />
        <span className="absolute inset-x-[10%] top-[36%] h-[12%] rounded-[3px] border border-zinc-800 bg-zinc-950" />
        <span className="absolute inset-x-[10%] top-[64%] h-[18%] rounded-[3px] bg-zinc-200" />

        {/* Selection frame over the pay button, with its click point */}
        <span
          className={cn(
            "absolute inset-x-[6%] top-[60%] h-[26%] rounded-md border-2 motion-safe:transition-colors",
            isPage
              ? "border-indigo-300 bg-indigo-400/20"
              : "border-indigo-400/80 bg-indigo-400/10",
          )}
        />
        <span className="absolute top-[73%] left-[38%] size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-indigo-400/80" />
      </div>
    </div>
  );
}

type CalloutRowProps = {
  callout: Callout;
  index: number;
  state: CalloutState;
};

function CalloutRow({ callout, index, state }: CalloutRowProps) {
  return (
    <li
      className={cn(
        "flex items-start gap-2 rounded-md border px-2 py-1.5 font-mono motion-safe:transition-[opacity,border-color,background-color] motion-safe:duration-300",
        state === "active"
          ? "border-indigo-400/60 bg-indigo-400/10"
          : "border-zinc-800 bg-zinc-900",
        state === "dimmed" && "opacity-45",
      )}
    >
      <span
        className={cn(
          "mt-px flex size-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold text-zinc-950 motion-safe:transition-colors",
          state === "active" ? "bg-indigo-300" : "bg-zinc-500",
        )}
      >
        {index + 1}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 @[22rem]:flex-row @[22rem]:gap-2">
        <span
          className={cn(
            "shrink-0 text-[10px] leading-4 @[22rem]:w-28",
            state === "active" ? "text-indigo-300" : "text-zinc-500",
          )}
        >
          {callout.label}
        </span>
        <span className="flex min-w-0 flex-col">
          {callout.lines.map((line) => (
            <span
              key={line.text}
              className={cn(
                "truncate text-[10px] leading-4",
                lineColor(line.tone),
              )}
            >
              {line.text}
            </span>
          ))}
        </span>
      </span>
    </li>
  );
}

function lineColor(tone: Callout["lines"][number]["tone"]) {
  if (tone === "error") return "text-red-400";
  if (tone === "accent") return "text-indigo-300";
  return "text-zinc-300";
}
