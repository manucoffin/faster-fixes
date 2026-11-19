import { cn } from "@workspace/ui/lib/utils";
import { CheckIcon } from "lucide-react";

type VsFitListProps = {
  points: string[];
  className?: string;
};

// The "FasterFixes is the right fit if" checklist, one hairline row per point.
export function VsFitList({ points, className }: VsFitListProps) {
  return (
    <ul className={cn("border-t", className)}>
      {points.map((point) => (
        <li key={point} className="flex items-start gap-4 border-b py-5">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-success/10">
            <CheckIcon aria-hidden className="size-3.5 text-success" />
          </span>
          <span className="text-lg leading-relaxed text-pretty text-foreground">
            {point}
          </span>
        </li>
      ))}
    </ul>
  );
}
