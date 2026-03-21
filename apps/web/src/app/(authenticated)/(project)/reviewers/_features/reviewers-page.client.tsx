"use client";

import { DashboardPageContent } from "@/app/_features/core/dashboard/dashboard-page-content";
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

import { ReviewersTab } from "./reviewers-tab.client";

export function ReviewersPage() {
  const { activeProject, isPending } = useActiveProject();

  if (isPending) {
    return (
      <div className="flex flex-col gap-4 p-6">
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
            Choose a project from the sidebar to manage its reviewers.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <DashboardPageContent
      breadcrumbs={[{ label: activeProject.name }, { label: "Reviewers" }]}
    >
      <ReviewersTab projectId={activeProject.id} />
    </DashboardPageContent>
  );
}
