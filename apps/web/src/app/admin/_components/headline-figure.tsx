import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import { getDeltaTone } from "../_helpers/get-delta-tone";

type HeadlineFigureProps = {
  label: string;
  value: string;
  // Omitted for a plain count with no comparison period.
  delta?: { value: number; label: string; comparison: string };
  hint: string;
  children?: React.ReactNode;
};

export function HeadlineFigure({
  label,
  value,
  delta,
  hint,
  children,
}: HeadlineFigureProps) {
  return (
    <HeadlineFigureFrame label={label}>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight">{value}</span>
        {delta && (
          <span
            className={cn("text-xs font-medium", getDeltaTone(delta.value))}
            title={delta.comparison}
          >
            {delta.label}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
      {children}
    </HeadlineFigureFrame>
  );
}

type HeadlineFigureSkeletonProps = {
  label: string;
};

export function HeadlineFigureSkeleton({ label }: HeadlineFigureSkeletonProps) {
  return (
    <HeadlineFigureFrame label={label}>
      <Skeleton className="h-9 w-28" />
      <Skeleton className="h-4 w-36" />
    </HeadlineFigureFrame>
  );
}

type HeadlineFigureFrameProps = {
  label: string;
  children: React.ReactNode;
};

export function HeadlineFigureFrame({
  label,
  children,
}: HeadlineFigureFrameProps) {
  return (
    <div className="space-y-1 p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
