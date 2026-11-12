import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";

type SectionHeadingProps = {
  children: ReactNode;
  className?: string;
};

export function SectionHeading({ children, className }: SectionHeadingProps) {
  return (
    <h2
      className={cn(
        "max-w-3xl text-3xl leading-tight font-semibold tracking-tight text-balance md:text-4xl",
        className,
      )}
    >
      {children}
    </h2>
  );
}
