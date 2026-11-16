import { TrelloIcon } from "@workspace/ui/components/icons/trello-icon";
import { cn } from "@workspace/ui/lib/utils";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import type { ReactNode } from "react";

const CYCLE = 8;

// Percentages of the cycle: each list select fills STEP after the previous
// one, and all of them clear at RESET so the loop starts again.
const FIRST_FILL = 12;
const STEP = 18;
const RESET = 92;

// Trello's default lists on a new board.
const MAPPINGS = [
  { status: "New", list: "To Do" },
  { status: "In progress", list: "Doing" },
  { status: "Resolved", list: "Done" },
] as const;

const ARIA_LABEL =
  "Project settings with the Website redesign Trello board linked, and its lists mapped to each status: New to To Do, In progress to Doing, Resolved to Done.";

function fillKeyframes() {
  return MAPPINGS.map((_, i) => {
    const start = FIRST_FILL + i * STEP;
    return `@keyframes tsm-value-${i} {
  0%, ${start}% { opacity: 0; transform: translateY(3px); }
  ${start + 4}%, ${RESET}% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(0); }
}
@keyframes tsm-placeholder-${i} {
  0%, ${start}% { opacity: 1; }
  ${start + 2}%, ${RESET}% { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes tsm-focus-${i} {
  0%, ${start - 4}% { opacity: 0; }
  ${start}% { opacity: 1; }
  ${start + 8}%, 100% { opacity: 0; }
}
.tsm-value-${i} { opacity: 0; animation: tsm-value-${i} ${CYCLE}s ease-out infinite; }
.tsm-placeholder-${i} { animation: tsm-placeholder-${i} ${CYCLE}s ease-out infinite; }
.tsm-focus-${i} { opacity: 0; animation: tsm-focus-${i} ${CYCLE}s ease-out infinite; }`;
  }).join("\n");
}

const styles = `
${fillKeyframes()}

@media (prefers-reduced-motion: reduce) {
  ${MAPPINGS.map((_, i) => `.tsm-value-${i}`).join(", ")} { animation: none; opacity: 1; transform: none; }
  ${MAPPINGS.map((_, i) => `.tsm-placeholder-${i}`).join(", ")} { animation: none; opacity: 0; }
  ${MAPPINGS.map((_, i) => `.tsm-focus-${i}`).join(", ")} { animation: none; opacity: 0; }
}
`;

type TrelloStepMappingIllustrationProps = {
  className?: string;
};

export function TrelloStepMappingIllustration({
  className,
}: TrelloStepMappingIllustrationProps) {
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
        className="flex w-3/4 flex-col gap-3 rounded-lg border bg-background p-3 text-[11px] shadow-sm"
      >
        <div className="flex items-center gap-1.5">
          <TrelloIcon colored className="size-3" />
          <span className="font-medium text-foreground">Trello</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground">Board</span>
          <MockSelect>
            <span className="truncate text-foreground">Website redesign</span>
          </MockSelect>
        </div>

        <div className="flex flex-col gap-1.5 border-t pt-3">
          {MAPPINGS.map(({ status, list }, i) => (
            <div key={status} className="grid grid-cols-[5fr_6fr] items-center">
              <span className="truncate text-muted-foreground">{status}</span>
              <MockSelect focusClassName={`tsm-focus-${i}`}>
                <span
                  className={`tsm-placeholder-${i} absolute inset-y-0 left-2 flex items-center text-muted-foreground/60`}
                >
                  Select a list
                </span>
                <span
                  className={`tsm-value-${i} flex min-w-0 items-center gap-1 text-foreground`}
                >
                  <CheckIcon className="size-2.5 shrink-0 text-success" />
                  <span className="truncate">{list}</span>
                </span>
              </MockSelect>
            </div>
          ))}
        </div>
      </div>
    </figure>
  );
}

type MockSelectProps = {
  focusClassName?: string;
  children: ReactNode;
};

function MockSelect({ focusClassName, children }: MockSelectProps) {
  return (
    <div className="relative flex h-6 items-center justify-between gap-1 rounded-md border bg-background px-2">
      {focusClassName && (
        <span
          className={`${focusClassName} pointer-events-none absolute -inset-px rounded-md ring-2 ring-ring/40`}
        />
      )}
      {children}
      <ChevronDownIcon className="size-2.5 shrink-0 text-muted-foreground" />
    </div>
  );
}
