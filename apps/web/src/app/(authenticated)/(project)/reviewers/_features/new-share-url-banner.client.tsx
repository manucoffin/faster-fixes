"use client";

import { Button } from "@workspace/ui/components/button";
import { Check, Copy } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

type NewShareUrlBannerProps = {
  shareUrl: string;
};

export function NewShareUrlBanner({ shareUrl }: NewShareUrlBannerProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      toast.error("Could not copy the link to the clipboard");
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-md border border-success bg-success/10 p-4">
      <p className="mb-2 text-sm font-medium text-success">
        Reviewer created! Share this link with your client:
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded bg-background px-2 py-1 font-mono text-xs break-all">
          {shareUrl}
        </code>
        <Button variant="ghost" size="icon" onClick={handleCopy}>
          {copied ? (
            <Check className="size-4 text-success" />
          ) : (
            <Copy className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
