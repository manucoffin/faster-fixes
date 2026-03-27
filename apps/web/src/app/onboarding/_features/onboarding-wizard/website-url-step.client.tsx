"use client";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

type WebsiteUrlStepProps = {
  url: string;
  onUrlChange: (url: string) => void;
  onBack: () => void;
  onNext: () => void;
  isPending: boolean;
  error: string | null;
};

export function WebsiteUrlStep({
  url,
  onUrlChange,
  onBack,
  onNext,
  isPending,
  error,
}: WebsiteUrlStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">What&apos;s the website URL?</h1>
        <p className="text-muted-foreground text-sm">
          The main URL of the website where you&apos;ll install the feedback widget.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="project-url" className="text-sm font-medium">
          Website URL
        </label>
        <Input
          id="project-url"
          placeholder="https://client.com"
          type="url"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && url.trim()) onNext();
          }}
          disabled={isPending}
          autoFocus
        />
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} disabled={isPending}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!url.trim() || isPending}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating project...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
