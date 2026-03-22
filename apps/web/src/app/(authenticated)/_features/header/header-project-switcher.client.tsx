"use client";

import { useActiveProject } from "@/app/_features/project/active-project-provider.client";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Check, ChevronsUpDown, FolderOpen, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { CreateProjectDialog } from "../sidebar/project/create/create-project-dialog.client";

function HeaderProjectSwitcherLoading() {
  return <Skeleton className="h-5 w-24" />;
}

export function HeaderProjectSwitcher() {
  const { activeProject, projects, isPending, setActiveProject } =
    useActiveProject();
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  if (isPending) {
    return <HeaderProjectSwitcherLoading />;
  }

  const hasProjects = projects.length > 0;
  const displayName = activeProject?.name ?? "Select a project";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost">
            <span className="max-w-[160px] truncate">{displayName}</span>
            <ChevronsUpDown className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-56 rounded-lg" align="start">
          <DropdownMenuLabel>Projects</DropdownMenuLabel>
          {hasProjects && (
            <DropdownMenuGroup>
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onSelect={() => {
                    setActiveProject(project.id);
                    router.push("/inbox");
                  }}
                  className="flex items-center gap-2"
                >
                  <FolderOpen className="text-muted-foreground size-4" />
                  <span className="flex-1 truncate">{project.name}</span>
                  {project.id === activeProject?.id && (
                    <Check className="text-muted-foreground size-4" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 size-4" />
            Create project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
