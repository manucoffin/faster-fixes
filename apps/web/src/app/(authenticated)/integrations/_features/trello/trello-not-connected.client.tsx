"use client";

import { Button } from "@workspace/ui/components/button";
import { TrelloIcon } from "@workspace/ui/components/icons/trello-icon";

export function TrelloNotConnected() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        No Trello account connected. Authorize Faster Fixes to mirror feedback
        into Trello as cards that move with each status change.
      </p>
      <p className="text-sm text-muted-foreground">
        Authorize with a service account rather than a personal one. The
        connection relies on the authorizing member&apos;s access, and breaks if
        that member leaves the boards or revokes it.
      </p>
      <Button asChild>
        <a href="/api/trello/install">
          <TrelloIcon className="size-4" />
          Connect to Trello
        </a>
      </Button>
    </div>
  );
}
