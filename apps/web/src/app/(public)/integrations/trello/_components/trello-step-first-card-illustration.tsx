import { TrelloIcon } from "@workspace/ui/components/icons/trello-icon";
import { cn } from "@workspace/ui/lib/utils";

const CYCLE = 6;

const ARIA_LABEL =
  "Animation showing a Trello list named New, where a card titled Subscribe button does nothing appears at the top and its screenshot cover fades in.";

// Percentages of the cycle. The card opens its slot, pushing the others down,
// then its Screenshot cover fades in, and everything holds until the reset.
const styles = `
@keyframes tfc-slot {
  0%, 8% { grid-template-rows: 0fr; }
  22%, 88% { grid-template-rows: 1fr; }
  100% { grid-template-rows: 0fr; }
}

@keyframes tfc-card {
  0%, 10% { opacity: 0; transform: translateY(-6px); }
  24%, 84% { opacity: 1; transform: translateY(0); }
  92%, 100% { opacity: 0; transform: translateY(0); }
}

@keyframes tfc-cover {
  0%, 30% { opacity: 0; }
  42%, 84% { opacity: 1; }
  92%, 100% { opacity: 0; }
}

.tfc-slot { grid-template-rows: 0fr; animation: tfc-slot ${CYCLE}s ease-in-out infinite; }
.tfc-card { opacity: 0; animation: tfc-card ${CYCLE}s ease-out infinite; }
.tfc-cover { opacity: 0; animation: tfc-cover ${CYCLE}s ease-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .tfc-slot { animation: none; grid-template-rows: 1fr; }
  .tfc-card, .tfc-cover { animation: none; opacity: 1; transform: none; }
}
`;

type TrelloStepFirstCardIllustrationProps = {
  className?: string;
};

export function TrelloStepFirstCardIllustration({
  className,
}: TrelloStepFirstCardIllustrationProps) {
  return (
    <figure
      aria-label={ARIA_LABEL}
      className={cn(
        "flex w-full items-center justify-center overflow-hidden rounded-2xl border bg-muted/60 p-5",
        className,
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div
        aria-hidden
        className="flex max-h-full w-3/4 flex-col gap-2 overflow-hidden rounded-xl border bg-background p-2 shadow-sm"
      >
        <div className="flex items-center gap-1.5 px-1 pt-0.5">
          <TrelloIcon colored className="size-3 shrink-0" />
          <span className="text-[11px] font-medium text-foreground">New</span>
          <span className="ml-auto h-1 w-3 rounded-full bg-foreground/15" />
        </div>

        <div className="flex flex-col">
          <div className="tfc-slot grid">
            <div className="min-h-0 overflow-hidden">
              <div className="tfc-card pb-1.5">
                <NewCard />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <SkeletonCard titleWidth="w-[70%]" />
            <SkeletonCard titleWidth="w-[55%]" />
          </div>
        </div>
      </div>
    </figure>
  );
}

function NewCard() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-xs">
      <div className="tfc-cover border-b bg-muted">
        <MockPageCover />
      </div>
      <div className="flex flex-col gap-1 px-2 py-1.5">
        <span className="h-1 w-6 rounded-full bg-primary/70" />
        <span className="truncate text-[11px] leading-tight text-card-foreground">
          Subscribe button does nothing
        </span>
      </div>
    </div>
  );
}

// A tiny webpage with its Subscribe button outlined, as the Screenshot shows it.
function MockPageCover() {
  return (
    <div className="relative aspect-[3/1] w-full">
      <div className="absolute inset-x-0 top-0 flex h-[18%] items-center gap-[4%] border-b border-foreground/10 px-[5%]">
        <span className="h-[35%] w-[12%] rounded-[1px] bg-foreground/25" />
        <span className="ml-auto h-[30%] w-[8%] rounded-[1px] bg-foreground/15" />
        <span className="h-[30%] w-[8%] rounded-[1px] bg-foreground/15" />
      </div>
      <span className="absolute top-[34%] left-[8%] h-[11%] w-[44%] rounded-[1px] bg-foreground/25" />
      <span className="absolute top-[52%] left-[8%] h-[7%] w-[34%] rounded-[1px] bg-foreground/15" />
      <span className="absolute top-[68%] left-[8%] h-[16%] w-[22%] rounded-[2px] bg-primary/70" />
      <span className="absolute top-[62%] left-[6%] h-[28%] w-[26%] rounded-[3px] border border-dashed border-primary" />
      <span className="absolute top-[30%] right-[8%] h-[54%] w-[30%] rounded-[2px] bg-foreground/10" />
    </div>
  );
}

type SkeletonCardProps = {
  titleWidth: string;
};

function SkeletonCard({ titleWidth }: SkeletonCardProps) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border bg-card px-2 py-2 shadow-xs">
      <span className={cn("h-1.5 rounded-full bg-foreground/20", titleWidth)} />
      <span className="h-1 w-[35%] rounded-full bg-foreground/10" />
    </div>
  );
}
