import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";

type MdxSectionProps = {
  children: ReactNode;
  /** Section background. */
  background?: "default" | "muted";
  className?: string;
};

export function MdxSection({
  children,
  background = "default",
  className,
}: MdxSectionProps) {
  return (
    <section
      className={cn(
        "py-16 md:py-24",
        background === "muted" && "bg-muted/50",
        className,
      )}
    >
      {children}
    </section>
  );
}
