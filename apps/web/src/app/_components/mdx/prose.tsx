import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";

type ProseProps = {
  children: ReactNode;
  /** Max width constraint. Default: "md" (max-w-4xl). Use "full" inside Columns. */
  maxWidth?: "sm" | "md" | "lg" | "full";
  className?: string;
};

const maxWidthClasses = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-5xl",
  full: "max-w-none",
};

export function Prose({ children, maxWidth = "md", className }: ProseProps) {
  return (
    <div
      className={cn(
        "dark:prose-invert prose w-full",
        "[&>h2]:mt-0 [&>h2]:text-primary [&>h3]:mt-0 [&>h3]:text-primary",
        maxWidthClasses[maxWidth],
        maxWidth !== "full" && "mx-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}
