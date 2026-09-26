"use client";

import { Button } from "@workspace/ui/components/button";
import { JiraIcon } from "@workspace/ui/components/icons/jira-icon";

export function JiraNotConnected() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        No Jira site connected. Authorize Faster Fixes to mirror feedback into
        Jira as issues with bidirectional status sync.
      </p>
      <p className="text-sm text-muted-foreground">
        Authorize with a service account rather than a personal one. Jira issues
        are attributed to the authorizing user, and the connection breaks if
        that user loses Jira access.
      </p>
      <Button asChild>
        <a href="/api/jira/install">
          <JiraIcon className="size-4" />
          Connect to Jira
        </a>
      </Button>
    </div>
  );
}
