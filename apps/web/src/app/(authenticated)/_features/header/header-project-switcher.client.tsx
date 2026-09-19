"use client";

import { useActiveProject } from "@/app/_domains/project/active-project/active-project-provider.client";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
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
import { CreateProjectDialog } from "../sidebar/project/create/create-project-dialog.client";

function HeaderProjectSwitcherLoading() {
  return <Skeleton className="h-5 w-24" />;
}

export function HeaderProjectSwitcher() {
  const { activeProject, isPending, projectsQuery, setActiveProject } =
    useActiveProject();
  const router = useRouter();
  if (isPending) {
    return <HeaderProjectSwitcherLoading />;
  }

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
          {matchQueryStatus(projectsQuery, {
            // The trigger above already renders the loading state, so this
            // branch only runs on a refetch of an empty cache.
            Loading: (
              <div className="px-2 py-1.5">
                <Skeleton className="h-4 w-32" />
              </div>
            ),
            Errored: (error) => (
              <div className="flex flex-col gap-1 px-2 py-1.5">
                <p className="text-sm text-destructive">
                  Failed to load your projects
                </p>
                <p className="text-xs text-muted-foreground">
                  {getErrorMessage(error)}
                </p>
              </div>
            ),
            Empty: <></>,
            Success: ({ data }) => (
              <DropdownMenuGroup>
                {data.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onSelect={() => {
                      setActiveProject(project.id);
                      router.push("/inbox");
                    }}
                    className="flex items-center gap-2"
                  >
                    <FolderOpen className="size-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{project.name}</span>
                    {project.id === activeProject?.id && (
                      <Check className="size-4 text-muted-foreground" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            ),
          })}

          <DropdownMenuSeparator />
          <CreateProjectDialog>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Plus className="size-4" />
              Create project
            </DropdownMenuItem>
          </CreateProjectDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
