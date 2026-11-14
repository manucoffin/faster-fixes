import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import { SlackIcon } from "@workspace/ui/components/icons/slack-icon";
import { cn } from "@workspace/ui/lib/utils";
import { ChevronDownIcon, ChevronRightIcon, PlayIcon } from "lucide-react";
import type { ReactNode } from "react";

const ARIA_LABEL =
  "A GitHub issue created from a feedback, beside its Slack notification. The issue quotes the comment, the Pay button stays disabled after I apply a coupon, then lists the page yourapp.com/checkout, the element button.pay-cta clicked at 912, 604, a Play in Faster Fixes link to the 48 s recording, the screenshot, the environment Chrome 131 on macOS 15 at 1440 by 900, and a collapsed Timeline with 6 steps, 1 console and 14 network entries. The Slack message repeats the comment, page and browser, shows the status New, and carries Open in Faster Fixes and Play recording buttons.";

const COMMENT = "The Pay button stays disabled after I apply a coupon.";
const PAGE = "yourapp.com/checkout";

export function IssueAndSlackIllustration() {
  return (
    <div
      role="img"
      aria-label={ARIA_LABEL}
      className="@container aspect-[16/10] w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 p-2 @min-[30rem]:p-3"
    >
      <div className="flex size-full items-center gap-2 @min-[30rem]:gap-3">
        <IssueCard />
        <SlackCard />
      </div>
    </div>
  );
}

// Sections follow the order of `formatIssueBody`. With a Recording, the
// Timeline carries the console and network entries, so no Diagnostics block.
function IssueCard() {
  return (
    <div className="flex h-full min-w-0 flex-[1.6] flex-col overflow-hidden rounded-md border border-zinc-800 bg-zinc-900">
      <div className="flex shrink-0 items-center gap-1.5 border-b border-zinc-800 px-2 py-1.5 @min-[30rem]:px-3 @min-[30rem]:py-2">
        <GithubIcon className="size-3 shrink-0 text-zinc-400" />
        <span className="truncate font-mono text-[9px] text-zinc-500 @min-[30rem]:text-[10px]">
          acme/website
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 font-mono text-[8px] leading-4 text-emerald-300 @min-[30rem]:text-[9px]">
          <span className="size-1 rounded-full bg-emerald-400" />
          Open
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1 px-2 py-1.5 @min-[30rem]:gap-1.5 @min-[30rem]:px-3 @min-[30rem]:py-2">
        <p className="truncate text-[10px] leading-4 font-medium text-zinc-100 @min-[30rem]:text-xs">
          The Pay button stays disabled after I apply a coupon.{" "}
          <span className="font-normal text-zinc-500">#142</span>
        </p>

        <p className="line-clamp-2 shrink-0 border-l-2 border-zinc-700 pl-1.5 text-[9px] leading-3 text-zinc-400 @min-[30rem]:text-[10px] @min-[30rem]:leading-4">
          {COMMENT}
        </p>

        <Field label="Page">
          <span className="text-indigo-300">{PAGE}</span>
        </Field>
        <Field label="Element">
          <span className="rounded-[2px] bg-zinc-800 px-0.5">
            button.pay-cta
          </span>{" "}
          <span className="text-zinc-500">· at (912, 604)</span>
        </Field>
        <Field label="Recording">
          <span className="inline-flex items-center gap-0.5 text-indigo-300">
            <PlayIcon className="size-2 shrink-0 fill-current" />
            Play in Faster Fixes
          </span>{" "}
          <span className="text-zinc-500">· 48 s</span>
        </Field>

        <ScreenshotThumbnail />

        <Details open summary="Environment">
          Chrome 131 · macOS 15 · 1440 × 900
        </Details>
        <Details summary="Timeline (6 steps, 1 console, 14 network)" />

        <p className="hidden shrink-0 truncate font-mono text-[8px] text-zinc-600 @min-[34rem]:block">
          Faster Fixes · View in dashboard
        </p>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  children: ReactNode;
};

function Field({ label, children }: FieldProps) {
  return (
    <p className="shrink-0 truncate font-mono text-[9px] leading-3 text-zinc-300 @min-[30rem]:text-[10px] @min-[30rem]:leading-4">
      <span className="font-semibold text-zinc-200">{label}:</span> {children}
    </p>
  );
}

type DetailsProps = {
  summary: string;
  open?: boolean;
  children?: ReactNode;
};

function Details({ summary, open = false, children }: DetailsProps) {
  const Chevron = open ? ChevronDownIcon : ChevronRightIcon;
  return (
    <div className="shrink-0 font-mono text-[9px] leading-3 @min-[30rem]:text-[10px] @min-[30rem]:leading-4">
      <p className="flex min-w-0 items-center gap-0.5 text-zinc-300">
        <Chevron className="size-2.5 shrink-0 text-zinc-500" />
        <span className="truncate">{summary}</span>
      </p>
      {children ? (
        <p className="truncate pl-3 text-zinc-500">{children}</p>
      ) : null}
    </div>
  );
}

// Absorbs the card's spare height, and disappears when there is none.
function ScreenshotThumbnail() {
  return (
    <div className="relative min-h-0 w-[70%] max-w-48 flex-1 overflow-hidden rounded-[3px] border border-zinc-800 bg-zinc-950">
      <span className="absolute inset-x-0 top-0 h-[14%] border-b border-zinc-800 bg-zinc-900" />
      <span className="absolute top-[26%] left-[8%] h-[8%] w-[40%] rounded-[2px] bg-zinc-700" />
      <span className="absolute top-[42%] left-[8%] h-[6%] w-[56%] rounded-[2px] bg-zinc-800" />
      <span className="absolute top-[54%] left-[8%] h-[6%] w-[48%] rounded-[2px] bg-zinc-800" />
      <span className="absolute top-[70%] left-[8%] h-[14%] w-[26%] rounded-[2px] bg-zinc-700" />
      <span className="absolute top-[66%] left-[5%] h-[22%] w-[32%] rounded-[3px] border border-dashed border-indigo-400/90 bg-indigo-400/10" />
      <span className="absolute right-1 bottom-1 rounded-[2px] bg-zinc-900/90 px-1 font-mono text-[8px] leading-3 text-zinc-500">
        Screenshot
      </span>
    </div>
  );
}

// Blocks follow `buildFeedbackBlocks`: reviewer and comment, page and
// environment, status, then the two buttons. The screenshot block is left out.
function SlackCard() {
  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-zinc-800 bg-zinc-900">
      <div className="flex items-center gap-1.5 border-b border-zinc-800 px-2 py-1.5 @min-[30rem]:px-3 @min-[30rem]:py-2">
        <SlackIcon className="size-3 shrink-0 text-zinc-400" />
        <span className="truncate font-mono text-[9px] text-zinc-500 @min-[30rem]:text-[10px]">
          #client-feedback
        </span>
      </div>

      <div className="flex gap-1.5 p-2 @min-[30rem]:gap-2 @min-[30rem]:p-3">
        <span className="hidden size-5 shrink-0 items-center justify-center rounded bg-indigo-500 font-mono text-[8px] font-semibold text-white @min-[34rem]:flex">
          FF
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1 @min-[30rem]:gap-1.5">
          <p className="flex min-w-0 items-center gap-1 text-[9px] leading-3 @min-[30rem]:text-[10px] @min-[30rem]:leading-4">
            <span className="truncate font-semibold text-zinc-100">
              Faster Fixes
            </span>
            <span className="shrink-0 rounded-[2px] bg-zinc-800 px-0.5 font-mono text-[7px] text-zinc-400">
              APP
            </span>
          </p>

          <div className="text-[9px] leading-3 @min-[30rem]:text-[10px] @min-[30rem]:leading-4">
            <p className="truncate font-semibold text-zinc-200">
              Claire Martin
            </p>
            <p className="line-clamp-3 text-zinc-400">{COMMENT}</p>
          </div>

          <p className="line-clamp-2 font-mono text-[8px] leading-3 text-zinc-500 @min-[30rem]:text-[9px]">
            <span className="text-indigo-300">{PAGE}</span> · Chrome · macOS
          </p>

          <p className="flex min-w-0 items-center gap-1 text-[9px] leading-3 text-zinc-300 @min-[30rem]:text-[10px] @min-[30rem]:leading-4">
            <span className="font-semibold">Status:</span>
            <span className="size-1.5 shrink-0 rounded-full bg-indigo-400" />
            New
          </p>

          <div className="mt-0.5 flex flex-col gap-1 @min-[34rem]:flex-row @min-[34rem]:flex-wrap">
            <SlackButton>Open in Faster Fixes</SlackButton>
            <SlackButton primary>
              <PlayIcon className="size-2 shrink-0 fill-current" />
              Play recording
            </SlackButton>
          </div>
        </div>
      </div>
    </div>
  );
}

type SlackButtonProps = {
  primary?: boolean;
  children: ReactNode;
};

function SlackButton({ primary = false, children }: SlackButtonProps) {
  return (
    <span
      className={cn(
        "flex min-w-0 items-center justify-center gap-1 truncate rounded border px-1.5 py-0.5 text-[8px] leading-3 font-medium whitespace-nowrap @min-[30rem]:text-[9px]",
        primary
          ? "border-indigo-400/50 bg-indigo-500/15 text-indigo-200"
          : "border-zinc-700 bg-zinc-800/60 text-zinc-300",
      )}
    >
      {children}
    </span>
  );
}
