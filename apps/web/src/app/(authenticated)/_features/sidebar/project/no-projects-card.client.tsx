"use client";

import { SidebarGroup } from "@workspace/ui/components/sidebar";
import { FolderOpen } from "lucide-react";
import { CreateProjectDialog } from "./create-project-dialog.client";

export function NoProjectsCard() {
  return (
    <SidebarGroup>
      <div className="mx-2 flex flex-col items-center gap-3 rounded-lg border border-dashed border-sidebar-border bg-sidebar-accent/50 p-4 text-center">
        <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary/10">
          <FolderOpen className="size-4 text-sidebar-primary" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-sidebar-foreground">
            No projects yet
          </p>
          <p className="text-xs text-muted-foreground">
            Create your first project to start collecting feedback.
          </p>
        </div>
        <CreateProjectDialog />
      </div>
    </SidebarGroup>
  );
}
