"use client";

import { cn } from "@workspace/ui/lib/utils";
import { CheckIcon, Clipboard } from "lucide-react";
import * as React from "react";

function CopyableText({
  children,
  className,
  ...props
}: React.ComponentProps<"span">) {
  const [copied, setCopied] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);

  const handleCopy = async () => {
    const text = ref.current?.textContent?.trim() ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span
      ref={ref}
      role="button"
      tabIndex={0}
      onClick={handleCopy}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCopy();
        }
      }}
      className={cn(
        "group/copy hover:bg-muted -mx-1 inline-flex cursor-pointer items-center gap-2 rounded-sm px-1 transition-colors",
        className,
      )}
      {...props}
    >
      <span className="min-w-0 truncate">{children}</span>
      <span className="relative inline-flex size-3.5 shrink-0">
        <Clipboard
          className={cn(
            "text-muted-foreground absolute inset-0 size-3.5 transition-opacity duration-200",
            copied ? "opacity-0" : "opacity-0 group-hover/copy:opacity-100",
          )}
        />
        <CheckIcon
          className={cn(
            "text-success absolute inset-0 size-3.5 transition-opacity duration-200",
            copied ? "opacity-100" : "opacity-0",
          )}
        />
      </span>
    </span>
  );
}

export { CopyableText };
