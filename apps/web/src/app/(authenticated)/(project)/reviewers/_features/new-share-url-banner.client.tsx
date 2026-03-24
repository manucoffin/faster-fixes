"use client";

import { Button } from "@workspace/ui/components/button";
import { Check, Copy } from "lucide-react";
import * as React from "react";

type NewShareUrlBannerProps = {
  shareUrl: string;
};

export function NewShareUrlBanner({ shareUrl }: NewShareUrlBannerProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-success bg-success/10 rounded-md border p-4">
      <p className="text-success mb-2 text-sm font-medium">
        Reviewer created! Share this link with your client:
      </p>
      <div className="flex items-center gap-2">
        <code className="bg-background flex-1 rounded px-2 py-1 font-mono text-xs break-all">
          {shareUrl}
        </code>
        <Button variant="ghost" size="icon" onClick={handleCopy}>
          {copied ? (
            <Check className="text-success size-4" />
          ) : (
            <Copy className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
