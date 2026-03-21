"use client";

import { CreateProjectDialog } from "./create/create-project-dialog.client";
import { useActiveProject } from "@/lib/active-project/active-project-provider.client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Check, ChevronsUpDown, FolderOpen, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

function ProjectSwitcherLoading() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="cursor-default">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="grid flex-1 gap-1.5 text-left text-sm leading-tight">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function ProjectSwitcher() {
  const { activeProject, projects, isPending, setActiveProject } =
    useActiveProject();
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  if (isPending) {
    return <ProjectSwitcherLoading />;
  }

  const hasProjects = projects.length > 0;
  const displayName = activeProject?.name ?? "Select a project";
  const displayUrl = activeProject?.url;

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
                  <FolderOpen className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{displayName}</span>
                  {displayUrl && (
                    <span className="text-muted-foreground truncate text-xs">
                      {displayUrl}
                    </span>
                  )}
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="start"
              sideOffset={4}
            >
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
        </SidebarMenuItem>
      </SidebarMenu>

      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
