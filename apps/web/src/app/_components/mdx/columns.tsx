import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";

type ColumnsProps = {
  children: ReactNode;
  /** Number of columns on desktop. Default: 2. */
  cols?: 2 | 3;
  /** Reverse visual order on desktop (swap left/right). */
  reverse?: boolean;
  /** Vertical alignment. Default: "center". */
  align?: "start" | "center" | "end";
  /** Gap size. Default: "md". */
  gap?: "sm" | "md" | "lg";
  className?: string;
};

const colClasses = {
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-3",
};

const gapClasses = {
  sm: "gap-4",
  md: "gap-8",
  lg: "gap-12",
};

const alignClasses = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
};

export function Columns({
  children,
  cols = 2,
  reverse = false,
  align = "center",
  gap = "md",
  className,
}: ColumnsProps) {
  return (
    <div
      className={cn(
        "grid w-full",
        colClasses[cols],
        gapClasses[gap],
        alignClasses[align],
        reverse && "[&>*:first-child]:md:order-last",
        className,
      )}
    >
      {children}
    </div>
  );
}
