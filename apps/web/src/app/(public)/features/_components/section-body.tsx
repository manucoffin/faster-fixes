import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";

type SectionBodyProps = {
  children: ReactNode;
  className?: string;
};

// Running text of a section: styles the links and inline code it contains.
export function SectionBody({ children, className }: SectionBodyProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 text-lg leading-relaxed text-pretty text-muted-foreground",
        "[&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:no-underline",
        "[&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
