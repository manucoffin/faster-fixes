"use client";

import { SidebarGroup } from "@workspace/ui/components/sidebar";
import { FolderOpen } from "lucide-react";
import { CreateProjectDialog } from "./create/create-project-dialog.client";

export function NoProjectsCard() {
  return (
    <SidebarGroup>
      <div className="bg-sidebar-accent/50 border-sidebar-border mx-2 flex flex-col items-center gap-3 rounded-lg border border-dashed p-4 text-center">
        <div className="bg-sidebar-primary/10 flex size-9 items-center justify-center rounded-lg">
          <FolderOpen className="text-sidebar-primary size-4" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sidebar-foreground text-sm font-medium">
            No projects yet
          </p>
          <p className="text-muted-foreground text-xs">
            Create your first project to start collecting feedback.
          </p>
        </div>
        <CreateProjectDialog />
      </div>
    </SidebarGroup>
  );
}
