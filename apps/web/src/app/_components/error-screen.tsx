import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";

type ErrorScreenProps = {
  title: string;
  description: string;
  /** Actions offered to the user: a retry button, a link out. */
  children?: ReactNode;
  className?: string;
};

export function ErrorScreen({
  title,
  description,
  children,
  className,
}: ErrorScreenProps) {
  return (
    <div
      className={cn(
        "flex min-h-[60vh] w-full flex-1 flex-col items-center justify-center gap-6 p-6 text-center",
        className,
      )}
    >
      <div className="flex max-w-md flex-col gap-2 text-balance">
        <h1 className="text-lg font-medium tracking-tight">{title}</h1>
        <p className="text-sm/relaxed text-muted-foreground">{description}</p>
      </div>

      {children ? (
        <div className="flex items-center justify-center gap-2">{children}</div>
      ) : null}
    </div>
  );
}
