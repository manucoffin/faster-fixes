import { BotIcon, LayoutDashboardIcon, MessageSquareIcon } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";

const ARIA_LABEL =
  "Diagram of where each licence stops. On your infrastructure, the Faster Fixes app, licensed AGPL-3.0, runs the dashboard, the widget API and the agent API. On your clients' sites, client-a.com, client-b.com and client-c.com each load the MIT-licensed @fasterfixes/widget package, which connects to the widget API across the licence boundary.";

const SITES = [
  { domain: "client-a.com", bar: "w-[62%]" },
  { domain: "client-b.com", bar: "w-[48%]" },
  { domain: "client-c.com", bar: "w-[70%]" },
] as const;

// Vertical centres of the three site rows, in the connector's 0-100 viewBox.
const SITE_CENTERS = [100 / 6, 50, 500 / 6];

const LICENCE_TAG_CLASSES = {
  "AGPL-3.0": "border-zinc-600 bg-zinc-800 text-zinc-300",
  MIT: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
} as const;

export function LicenceBoundaryIllustration() {
  return (
    <div
      role="img"
      aria-label={ARIA_LABEL}
      // The boundary line and connectors run on this canvas, between the panels.
      className="@container w-full rounded-lg border border-zinc-800 bg-zinc-900 p-3"
    >
      <SideBySideLayout />
      <StackedLayout />
    </div>
  );
}

// Both zones share the parent's rows through subgrid, so each site sits on a
// known third of the connector column and the app box centres on the middle
// one, where its Widget API row is.
function SideBySideLayout() {
  return (
    <div className="hidden grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)] grid-rows-[1.75rem_auto_repeat(3,minmax(0,1fr))_0.75rem] @min-[30rem]:grid @2xl:grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)]">
      <div className="col-start-1 row-span-5 row-start-2 grid grid-rows-subgrid rounded-lg border border-zinc-800 bg-zinc-950 pt-3 pl-3">
        <ZoneLabel>Your infrastructure</ZoneLabel>
        <div className="row-span-3 flex items-center">
          <div className="min-w-0 flex-1">
            <AppBox />
          </div>
          <span className="h-px w-3 shrink-0 bg-indigo-400/50" />
        </div>
      </div>

      <div className="relative col-start-2 row-span-6 row-start-1">
        <BoundaryTag className="absolute top-0 left-1/2 -translate-x-1/2" />
        <span className="absolute top-6 bottom-0 left-1/2 border-l border-dashed border-zinc-600" />
      </div>

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="col-start-2 row-span-3 row-start-3 size-full overflow-visible"
        aria-hidden
      >
        {SITE_CENTERS.map((y) => (
          <path
            key={y}
            d={`M100 ${y} C50 ${y} 50 50 0 50`}
            fill="none"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            className="stroke-indigo-400/50"
          />
        ))}
      </svg>

      <div className="col-start-3 row-span-5 row-start-2 grid grid-rows-subgrid rounded-lg border border-dashed border-zinc-700 bg-zinc-950/40 pt-3 pr-3">
        <ZoneLabel className="pl-3">Your clients&apos; sites</ZoneLabel>
        {SITES.map((site) => (
          <div key={site.domain} className="flex items-center py-1.5">
            <span className="h-px w-3 shrink-0 bg-indigo-400/50" />
            <SiteWindow {...site} />
          </div>
        ))}
      </div>
    </div>
  );
}

// A rail at `left-7` runs from the app box's Widget API row, through the
// boundary, to a branch for each site.
function StackedLayout() {
  return (
    <div className="flex flex-col @min-[30rem]:hidden">
      <div className="relative rounded-lg border border-zinc-800 bg-zinc-950 p-3">
        <ZoneLabel>Your infrastructure</ZoneLabel>
        <AppBox />
        <span className="absolute -bottom-px left-7 h-[13px] w-px bg-indigo-400/50" />
      </div>

      {/* Transparent border matches the panels' so the rail lines up. */}
      <div className="relative h-11 border-x border-transparent">
        <span className="absolute inset-y-0 left-7 w-px bg-indigo-400/50" />
        <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-zinc-600" />
        <BoundaryTag className="absolute top-1/2 right-3 -translate-y-1/2" />
      </div>

      <div className="relative flex flex-col gap-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-950/40 p-3 pl-12">
        <ZoneLabel className="mb-0">Your clients&apos; sites</ZoneLabel>
        {SITES.map((site) => (
          <div key={site.domain} className="relative flex">
            <span className="absolute top-1/2 right-full h-px w-5 bg-indigo-400/50" />
            <SiteWindow {...site} />
          </div>
        ))}
        {/* Stops at the last site's centre: panel padding plus half its height. */}
        <span className="absolute -top-px bottom-12 left-7 w-px bg-indigo-400/50" />
      </div>
    </div>
  );
}

type ZoneLabelProps = {
  children: ReactNode;
  className?: string;
};

function ZoneLabel({ children, className }: ZoneLabelProps) {
  return (
    <p
      className={cn(
        "mb-2 truncate font-mono text-[11px] text-zinc-400",
        className,
      )}
    >
      {children}
    </p>
  );
}

type BoundaryTagProps = {
  className: string;
};

function BoundaryTag({ className }: BoundaryTagProps) {
  return (
    <span
      className={cn(
        "rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 font-mono text-[10px] whitespace-nowrap text-zinc-300",
        className,
      )}
    >
      Licence boundary
    </span>
  );
}

type LicenceTagProps = {
  licence: keyof typeof LICENCE_TAG_CLASSES;
};

function LicenceTag({ licence }: LicenceTagProps) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-1.5 font-mono text-[9px] leading-4",
        LICENCE_TAG_CLASSES[licence],
      )}
    >
      {licence}
    </span>
  );
}

const APP_ROWS = [
  { label: "Dashboard", Icon: LayoutDashboardIcon, widget: false },
  { label: "Widget API", Icon: MessageSquareIcon, widget: true },
  { label: "Agent API", Icon: BotIcon, widget: false },
] as const;

// Side by side, the header and footer share a height so the Widget API row
// sits at the box's centre. Stacked, it moves last so the rail leaves from it.
function AppBox() {
  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-zinc-800 bg-zinc-900">
      <div className="flex h-8 items-center justify-between gap-2 border-b border-zinc-800 px-2.5">
        <span className="truncate text-[11px] font-medium text-zinc-200">
          Faster Fixes app
        </span>
        <LicenceTag licence="AGPL-3.0" />
      </div>

      <div className="flex flex-col gap-1 p-1.5">
        {APP_ROWS.map(({ label, Icon, widget }) => (
          <div
            key={label}
            className={
              widget
                ? "order-last flex h-7 items-center gap-2 rounded bg-indigo-500/10 px-2 font-mono text-[10px] text-indigo-200 ring-1 ring-indigo-400/40 @min-[30rem]:order-none"
                : "flex h-7 items-center gap-2 rounded bg-zinc-800/50 px-2 font-mono text-[10px] text-zinc-400"
            }
          >
            <Icon
              className={cn(
                "size-3 shrink-0",
                widget ? "text-indigo-300" : "text-zinc-500",
              )}
            />
            <span className="truncate">{label}</span>
          </div>
        ))}
      </div>

      <div className="hidden h-8 items-center gap-1.5 border-t border-zinc-800 px-2.5 @min-[30rem]:flex">
        <span className="size-1.5 shrink-0 rounded-full bg-emerald-400" />
        <span className="truncate font-mono text-[10px] text-zinc-500">
          app.your-agency.com
        </span>
      </div>
    </div>
  );
}

// Fixed height: the stacked layout's rail ends at the last site's centre.
function SiteWindow({ domain, bar }: (typeof SITES)[number]) {
  return (
    <div className="flex h-[4.5rem] min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-zinc-800 bg-zinc-900">
      <div className="flex h-6 shrink-0 items-center gap-1 border-b border-zinc-800/80 px-2">
        <span className="size-1.5 rounded-full bg-zinc-700" />
        <span className="size-1.5 rounded-full bg-zinc-700" />
        <span className="size-1.5 rounded-full bg-zinc-700" />
        <span className="ml-1 truncate font-mono text-[10px] text-zinc-500">
          {domain}
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-between p-2">
        <div className={cn("h-1.5 rounded-[2px] bg-zinc-800", bar)} />
        <div className="flex max-w-full min-w-0 items-center gap-1.5 self-end rounded border border-zinc-700 bg-zinc-800/80 py-0.5 pr-0.5 pl-1.5">
          <span className="truncate font-mono text-[10px] text-zinc-300">
            @fasterfixes/widget
          </span>
          <LicenceTag licence="MIT" />
        </div>
      </div>
    </div>
  );
}
