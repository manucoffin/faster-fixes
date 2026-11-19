import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";
import { SectionBody } from "../../features/_components/section-body";

type VsHonestTakeSide = {
  lead: ReactNode;
  items: { key: string; content: ReactNode }[];
};

type VsHonestTakeProps = {
  competitor: VsHonestTakeSide;
  // Omitted when the page only lists where the competitor wins.
  fasterFixes?: VsHonestTakeSide;
  verdict?: ReactNode;
};

function HonestTakeColumn({ lead, items }: VsHonestTakeSide) {
  return (
    <SectionBody className="p-6 md:p-8">
      <p className="text-foreground">{lead}</p>
      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.key} className="flex gap-3">
            <span
              aria-hidden
              className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-muted-foreground/60"
            />
            <span className="[&_strong]:font-medium [&_strong]:text-foreground">
              {item.content}
            </span>
          </li>
        ))}
      </ul>
    </SectionBody>
  );
}

// Competitor strengths and our brief side by side, the verdict under both.
// With competitor strengths only, it renders as a single column.
export function VsHonestTake({
  competitor,
  fasterFixes,
  verdict,
}: VsHonestTakeProps) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-background">
      <div
        className={cn(
          "grid grid-cols-1",
          fasterFixes && "divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0",
        )}
      >
        <HonestTakeColumn {...competitor} />
        {fasterFixes && <HonestTakeColumn {...fasterFixes} />}
      </div>
      {verdict && (
        <SectionBody className="border-t bg-muted/50 p-6 md:p-8 [&>p]:max-w-4xl">
          {verdict}
        </SectionBody>
      )}
    </div>
  );
}
