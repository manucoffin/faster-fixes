"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useCallback, useState } from "react";

interface CopyCommandProps {
  command: string;
}

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
      className="bg-muted mt-8 inline-flex items-center gap-3 rounded-lg border px-4 py-3 font-mono text-sm transition-colors hover:bg-accent"
    >
      <span className="text-muted-foreground">$</span>
      <span>{command}</span>
      {copied ? (
        <CheckIcon className="text-muted-foreground size-4 shrink-0" />
      ) : (
        <CopyIcon className="text-muted-foreground size-4 shrink-0" />
      )}
    </button>
  );
}
