"use client";

import { useActiveProject } from "@/app/_features/project/active-project-provider.client";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { FolderOpen } from "lucide-react";
import { InboxTabs } from "./inbox-tabs.client";

export function InboxContent() {
  const { activeProject, isPending } = useActiveProject();

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!activeProject) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderOpen />
          </EmptyMedia>
          <EmptyTitle>Select a project</EmptyTitle>
          <EmptyDescription>
            Choose a project from the sidebar to view its feedback inbox.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return <InboxTabs />;
}
