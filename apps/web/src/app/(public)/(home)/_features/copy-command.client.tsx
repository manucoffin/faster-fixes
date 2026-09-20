"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useCallback, useState } from "react";

type CopyCommandProps = {
  command: string;
};

export function CopyCommand({ command }: CopyCommandProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [command]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="mt-8 inline-flex items-center gap-3 rounded-lg border bg-muted px-4 py-3 font-mono text-sm transition-colors hover:bg-accent"
    >
      <span className="text-muted-foreground">$</span>
      <span>{command}</span>
      {copied ? (
        <CheckIcon className="size-4 shrink-0 text-muted-foreground" />
      ) : (
        <CopyIcon className="size-4 shrink-0 text-muted-foreground" />
      )}
    </button>
  );
}
