"use client";

import { Button } from "@workspace/ui/components/button";
import { LinearIcon } from "@workspace/ui/components/icons/linear-icon";

export function LinearNotConnected() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        No Linear workspace connected. Authorize Faster Fixes to mirror feedback
        into Linear as issues with bidirectional status sync.
      </p>
      <Button asChild>
        <a href="/api/linear/install">
          <LinearIcon className="size-4" />
          Connect to Linear
        </a>
      </Button>
    </div>
  );
}
