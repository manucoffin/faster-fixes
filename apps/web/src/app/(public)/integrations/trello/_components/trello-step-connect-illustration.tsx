import { TrelloIcon } from "@workspace/ui/components/icons/trello-icon";
import { cn } from "@workspace/ui/lib/utils";
import { CheckIcon } from "lucide-react";

const CYCLE = 9;

// Trello's consent screen is drawn in Trello's own brand color, which no theme token carries.
const TRELLO_BLUE = "#0052CC";

const ARIA_LABEL =
  "Illustration showing the Connect to Trello button in Faster Fixes, then Trello's authorization screen with an Allow button, then the organization's Trello account shown as connected.";

// Three states share one panel and crossfade in turn, a third of the cycle each.
// The button of the first two states is pressed just before its state fades out.
const styles = `
@keyframes tsc-state-0 {
  0%, 28% { opacity: 1; transform: translateY(0); }
  33%, 95% { opacity: 0; transform: translateY(-4px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes tsc-state-1 {
  0%, 30% { opacity: 0; transform: translateY(4px); }
  35%, 61% { opacity: 1; transform: translateY(0); }
  66%, 100% { opacity: 0; transform: translateY(-4px); }
}
@keyframes tsc-state-2 {
  0%, 63% { opacity: 0; transform: translateY(4px); }
  68%, 95% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(0); }
}
@keyframes tsc-host-app {
  0%, 30% { opacity: 1; }
  33%, 63% { opacity: 0; }
  66%, 100% { opacity: 1; }
}
@keyframes tsc-press-0 {
  0%, 21% { transform: scale(1); }
  24% { transform: scale(0.94); }
  27%, 100% { transform: scale(1); }
}
@keyframes tsc-press-1 {
  0%, 54% { transform: scale(1); }
  57% { transform: scale(0.92); }
  60%, 100% { transform: scale(1); }
}

.tsc-state-0 { animation: tsc-state-0 ${CYCLE}s ease-in-out infinite; }
.tsc-state-1 { opacity: 0; animation: tsc-state-1 ${CYCLE}s ease-in-out infinite; }
.tsc-state-2 { opacity: 0; animation: tsc-state-2 ${CYCLE}s ease-in-out infinite; }
.tsc-host-app { animation: tsc-host-app ${CYCLE}s ease-in-out infinite; }
.tsc-host-trello { opacity: 0; animation: tsc-state-1 ${CYCLE}s ease-in-out infinite; }
.tsc-press-0 { animation: tsc-press-0 ${CYCLE}s ease-in-out infinite; }
.tsc-press-1 { animation: tsc-press-1 ${CYCLE}s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .tsc-state-0, .tsc-state-2, .tsc-host-app { animation: none; opacity: 0; }
  .tsc-state-1, .tsc-host-trello { animation: none; opacity: 1; transform: none; }
  .tsc-press-0, .tsc-press-1 { animation: none; }
}
`;

type TrelloStepConnectIllustrationProps = {
  className?: string;
};

export function TrelloStepConnectIllustration({
  className,
}: TrelloStepConnectIllustrationProps) {
  return (
    <figure
      aria-label={ARIA_LABEL}
      className={cn(
        "flex w-full items-center justify-center overflow-hidden rounded-2xl border bg-muted/60",
        className,
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div
        aria-hidden
        className="flex w-3/4 flex-col overflow-hidden rounded-lg border bg-background shadow-sm"
      >
        <WindowBar />
        <div className="grid grid-cols-[minmax(0,1fr)] p-3">
          <ConnectState />
          <ConsentState />
          <ConnectedState />
        </div>
      </div>
    </figure>
  );
}

function WindowBar() {
  return (
    <div className="flex items-center gap-1 border-b px-2.5 py-1.5">
      <span className="size-1.5 rounded-full bg-muted-foreground/30" />
      <span className="size-1.5 rounded-full bg-muted-foreground/30" />
      <span className="size-1.5 rounded-full bg-muted-foreground/30" />
      <span className="ml-1.5 grid font-mono text-[9px] text-muted-foreground">
        <span className="tsc-host-app col-start-1 row-start-1">
          app.fasterfixes.com
        </span>
        <span className="tsc-host-trello col-start-1 row-start-1">
          trello.com
        </span>
      </span>
    </div>
  );
}

function ConnectState() {
  return (
    <div className="tsc-state-0 col-start-1 row-start-1 flex flex-col justify-center gap-3">
      <IntegrationRow status="Not connected" />
      <span className="tsc-press-0 flex items-center justify-center gap-1.5 self-start rounded-md bg-primary px-2.5 py-1.5 text-[10px] font-medium text-primary-foreground">
        <TrelloIcon className="size-2.5" />
        Connect to Trello
      </span>
    </div>
  );
}

function ConsentState() {
  return (
    <div className="tsc-state-1 col-start-1 row-start-1 flex flex-col items-center gap-2.5 text-center">
      <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
        <TrelloIcon colored className="size-3" />
        Trello
      </span>
      <span className="text-[11px] leading-snug font-medium text-foreground">
        Let Faster Fixes use your account?
      </span>
      <ul className="flex flex-col gap-1 self-stretch text-left">
        {["Read your boards", "Create and move cards"].map((permission) => (
          <li
            key={permission}
            className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
          >
            <CheckIcon className="size-2.5 shrink-0" />
            {permission}
          </li>
        ))}
      </ul>
      <div className="flex w-full min-w-0 gap-1.5 self-stretch">
        <span className="min-w-0 flex-1 rounded-[4px] bg-muted py-1 text-[10px] font-medium text-muted-foreground">
          Deny
        </span>
        <span
          className="tsc-press-1 min-w-0 flex-1 rounded-[4px] py-1 text-[10px] font-medium text-white"
          style={{ backgroundColor: TRELLO_BLUE }}
        >
          Allow
        </span>
      </div>
    </div>
  );
}

function ConnectedState() {
  return (
    <div className="tsc-state-2 col-start-1 row-start-1 flex flex-col justify-center gap-3">
      <IntegrationRow status="Authorized as Acme Studio" connected />
      <span className="h-1.5 w-4/5 rounded-[2px] bg-muted" />
    </div>
  );
}

type IntegrationRowProps = {
  status: string;
  connected?: boolean;
};

function IntegrationRow({ status, connected = false }: IntegrationRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md border bg-background">
        <TrelloIcon colored className="size-3.5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[11px] font-medium text-foreground">Trello</span>
        <span className="truncate text-[9px] text-muted-foreground">
          {status}
        </span>
      </span>
      {connected ? (
        <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-success/10 px-1.5 py-0.5 text-[9px] font-medium text-success">
          <CheckIcon className="size-2.5" />
          Connected
        </span>
      ) : null}
    </div>
  );
}
