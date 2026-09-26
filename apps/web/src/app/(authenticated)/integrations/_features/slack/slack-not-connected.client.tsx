"use client";

import { Button } from "@workspace/ui/components/button";
import { SlackIcon } from "@workspace/ui/components/icons/slack-icon";

export function SlackNotConnected() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        No Slack workspace connected. Add Faster Fixes to Slack to get notified
        when feedback arrives or changes.
      </p>
      <Button asChild>
        <a href="/api/slack/install">
          <SlackIcon className="size-4" />
          Add to Slack
        </a>
      </Button>
    </div>
  );
}
