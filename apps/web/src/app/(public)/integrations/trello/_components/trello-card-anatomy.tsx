import { TrelloIcon } from "@workspace/ui/components/icons/trello-icon";
import { cn } from "@workspace/ui/lib/utils";
import { AlignLeftIcon, ChevronDownIcon, ImageIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";

const ARIA_LABEL =
  "An open Trello card titled The Subscribe button does nothing on mobile. The screenshot of acme.com/pricing, with the Subscribe button outlined, is the card cover. The description holds the comment, the page URL and the selector button.cta-primary, a link to the 42 second Recording, the environment Safari 18 on iOS 18 at 390 by 844 submitted by Sarah Chen, the custom metadata userId and build, the diagnostics with a TypeError and a failed POST /api/subscribe returning 500, and a link to the dashboard. Numbers 1 to 6 tie each part to its line in the list.";

type TrelloCardAnatomyProps = {
  className?: string;
};

// Every size inside is in `em` off one font size set in container units, so the
// card scales as a whole with its frame and never reflows. The cover takes the
// height left over, which absorbs the 8px floor on the narrowest frames.
export function TrelloCardAnatomy({ className }: TrelloCardAnatomyProps) {
  return (
    <figure
      aria-label={ARIA_LABEL}
      className={cn(
        "@container relative w-full overflow-hidden rounded-2xl border bg-muted/60",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 flex p-[0.9em] text-[length:clamp(8px,2.4cqw,13px)] leading-[1.4] text-foreground lg:text-[length:clamp(8px,2.8cqw,13px)]"
      >
        <div className="flex min-h-0 w-full flex-col overflow-hidden rounded-[0.9em] border bg-background shadow-sm">
          <CardCover />
          <div className="flex shrink-0 flex-col gap-[0.8em] p-[0.9em]">
            <CardHeader />
            <CardDescription />
          </div>
        </div>
      </div>
    </figure>
  );
}

function CardCover() {
  return (
    <div className="relative min-h-[5em] flex-1 border-b bg-muted">
      <PricingScreenshot />

      <span className="absolute top-[0.6em] left-[0.6em] rounded-full ring-[0.15em] ring-muted">
        <Marker number={2} />
      </span>
      <span className="absolute top-[0.6em] right-[0.6em] flex size-[1.8em] items-center justify-center rounded-full bg-background/80 text-muted-foreground">
        <XIcon className="size-[1em]" />
      </span>
      <span className="absolute right-[0.6em] bottom-[0.6em] flex items-center gap-[0.3em] rounded-[0.3em] bg-background/80 px-[0.5em] py-[0.15em] text-[0.85em] font-medium text-muted-foreground">
        <ImageIcon className="size-[1em]" />
        Cover
      </span>
    </div>
  );
}

// The mobile pricing page the reviewer was on, with the Subscribe button
// outlined by the Selection frame.
function PricingScreenshot() {
  return (
    <div className="absolute top-[10%] bottom-[10%] left-1/2 aspect-[3/5] -translate-x-1/2 overflow-hidden rounded-[0.35em] border bg-background shadow-sm">
      {/* Navigation */}
      <div className="absolute inset-x-0 top-0 flex h-[9%] items-center justify-between border-b px-[10%]">
        <span className="h-[30%] w-[28%] rounded-[1px] bg-foreground/25" />
        <span className="h-[26%] w-[12%] rounded-[1px] bg-foreground/15" />
      </div>

      {/* Heading */}
      <span className="absolute top-[16%] left-[10%] h-[4%] w-[62%] rounded-[1px] bg-foreground/25" />
      <span className="absolute top-[23%] left-[10%] h-[2.5%] w-[48%] rounded-[1px] bg-foreground/10" />

      {/* Plan */}
      <div className="absolute inset-x-[10%] top-[32%] bottom-[8%] rounded-[0.3em] border bg-muted/50">
        <span className="absolute top-[10%] left-[10%] h-[6%] w-[30%] rounded-[1px] bg-foreground/25" />
        <span className="absolute top-[24%] left-[10%] h-[3.5%] w-[70%] rounded-[1px] bg-foreground/10" />
        <span className="absolute top-[33%] left-[10%] h-[3.5%] w-[60%] rounded-[1px] bg-foreground/10" />
        <span className="absolute top-[42%] left-[10%] h-[3.5%] w-[66%] rounded-[1px] bg-foreground/10" />
        <span className="absolute inset-x-[10%] top-[66%] h-[13%] rounded-[0.2em] bg-foreground/80" />

        {/* Selection frame and click point */}
        <span className="absolute inset-x-[5%] top-[61%] h-[23%] rounded-[0.3em] border-[0.12em] border-dashed border-indigo-500 bg-indigo-500/10" />
        <span className="absolute top-[72.5%] left-[62%] size-[0.9em] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.15em] border-indigo-500" />
      </div>
    </div>
  );
}

function CardHeader() {
  return (
    <div className="flex items-start gap-[0.6em]">
      <span className="mt-[0.3em] size-[1.1em] shrink-0 rounded-full border-[0.12em] border-foreground/30" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[1.3em] leading-[1.25] font-semibold">
          The Subscribe button does nothing on mobile.
        </p>
        <p className="mt-[0.2em] flex items-center gap-[0.35em] text-[0.9em] text-muted-foreground">
          <TrelloIcon colored className="size-[1em] shrink-0" />
          in list
          <span className="font-medium text-foreground underline underline-offset-2">
            New
          </span>
        </p>
      </div>
    </div>
  );
}

// The description in the order the integration writes it. Below `lg` the two
// columns sit side by side; on the portrait frame they stack.
function CardDescription() {
  return (
    <div className="flex flex-col gap-[0.5em]">
      <p className="flex items-center gap-[0.5em] font-semibold">
        <AlignLeftIcon className="size-[1.1em] shrink-0 text-muted-foreground" />
        Description
      </p>

      <div className="grid grid-cols-2 gap-x-[1.2em] gap-y-[0.7em] lg:grid-cols-1">
        <div className="flex min-w-0 flex-col gap-[0.7em]">
          <Region number={1}>
            <p className="line-clamp-2 border-l-[0.2em] border-foreground/20 pl-[0.5em] text-muted-foreground">
              The Subscribe button does nothing on mobile.
            </p>
            <Line>
              <span className="font-semibold">Page:</span>{" "}
              <LinkText>acme.com/pricing</LinkText>
            </Line>
            <Line>
              <span className="font-semibold">Element:</span>{" "}
              <InlineCode>button.cta-primary</InlineCode>
            </Line>
          </Region>

          <Region number={4}>
            <p className="line-clamp-2">
              <span className="font-semibold">Recording:</span>{" "}
              <LinkText>Play in Faster Fixes</LinkText>
              <span className="text-muted-foreground"> · 42 s</span>
            </p>
          </Region>

          <Region number={5}>
            <SectionTitle>Environment</SectionTitle>
            <Line muted>Safari 18 · iOS 18</Line>
            <Line muted>Viewport 390 × 844</Line>
            <Line muted>Submitted by Sarah Chen</Line>
          </Region>
        </div>

        <div className="flex min-w-0 flex-col gap-[0.7em]">
          <Region number={6}>
            <SectionTitle>Custom metadata</SectionTitle>
            <Line muted>
              <InlineCode>userId</InlineCode>: usr_8f2k
            </Line>
            <Line muted>
              <InlineCode>build</InlineCode>: 2.4.1
            </Line>
          </Region>

          <Region number={3}>
            <SectionTitle>Diagnostics (1 console, 1 network)</SectionTitle>
            <div className="mt-[0.2em] flex flex-col rounded-[0.4em] bg-muted px-[0.6em] py-[0.35em] font-mono text-[0.9em]">
              <span className="truncate text-destructive">
                TypeError: plan.id is undefined
              </span>
              <span className="truncate text-muted-foreground">
                POST /api/subscribe{" "}
                <span className="text-destructive">500</span>
              </span>
            </div>
          </Region>

          <Region number={6}>
            <Line>
              <span className="text-[0.85em]">
                <LinkText>Faster Fixes</LinkText>
                <span className="text-muted-foreground"> · </span>
                <LinkText>View in dashboard</LinkText>
              </span>
            </Line>
          </Region>
        </div>
      </div>
    </div>
  );
}

type RegionProps = {
  number: number;
  children: ReactNode;
};

function Region({ number, children }: RegionProps) {
  return (
    <div className="flex gap-[0.5em]">
      <Marker number={number} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

type MarkerProps = {
  number: number;
};

// Matches the number of the line in the list beside the card.
function Marker({ number }: MarkerProps) {
  return (
    <span className="flex size-[1.4em] shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white">
      <span className="text-[0.72em] leading-none font-semibold tabular-nums">
        {number}
      </span>
    </span>
  );
}

type LineProps = {
  muted?: boolean;
  children: ReactNode;
};

function Line({ muted = false, children }: LineProps) {
  return (
    <p className={cn("truncate", muted && "text-muted-foreground")}>
      {children}
    </p>
  );
}

type SectionTitleProps = {
  children: ReactNode;
};

function SectionTitle({ children }: SectionTitleProps) {
  return (
    <p className="flex min-w-0 items-center gap-[0.25em] font-medium">
      <ChevronDownIcon className="size-[1em] shrink-0 text-muted-foreground" />
      <span className="truncate">{children}</span>
    </p>
  );
}

type TextProps = {
  children: ReactNode;
};

function LinkText({ children }: TextProps) {
  return (
    <span className="text-blue-600 underline-offset-2 dark:text-blue-400">
      {children}
    </span>
  );
}

function InlineCode({ children }: TextProps) {
  return (
    <code className="rounded-[0.25em] bg-muted px-[0.3em] font-mono text-[0.9em]">
      {children}
    </code>
  );
}
