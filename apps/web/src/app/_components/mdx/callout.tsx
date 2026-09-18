import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";

type CalloutProps = {
  children: ReactNode;
  /** Visual style. Default: "info". */
  type?: "tip" | "info" | "warning" | "note";
  title?: string;
};

const styles = {
  tip: {
    container: "border-success/50 bg-success/5",
    title: "text-success",
  },
  info: {
    container: "border-info/50 bg-info/5",
    title: "text-info",
  },
  warning: {
    container: "border-warning/50 bg-warning/5",
    title: "text-warning",
  },
  note: {
    container: "border-muted-foreground/30 bg-muted/50",
    title: "text-muted-foreground",
  },
};

export function Callout({ children, type = "info", title }: CalloutProps) {
  const s = styles[type];

  return (
    <div
      className={cn(
        "not-prose my-6 rounded-lg border-l-4 px-5 py-4",
        s.container,
      )}
    >
      {title && (
        <p className={cn("mb-2 text-sm font-semibold", s.title)}>{title}</p>
      )}
      <div className="text-sm leading-relaxed text-muted-foreground [&>p]:m-0">
        {children}
      </div>
    </div>
  );
}
