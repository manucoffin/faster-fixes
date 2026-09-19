"use client";

import { useActiveProject } from "@/app/_domains/project/active-project/active-project-provider.client";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Inbox, Settings2, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NoProjectsCard } from "./no-projects-card.client";

export function ProjectNavigation() {
  const { activeProject, projectsQuery } = useActiveProject();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const items = [
    { label: "Inbox", href: "/inbox" as const, icon: Inbox },
    { label: "Reviewers", href: "/reviewers" as const, icon: Users },
    { label: "Settings", href: "/settings" as const, icon: Settings2 },
  ];

  return matchQueryStatus(projectsQuery, {
    Loading: (
      <SidebarGroup>
        <div className="flex flex-col gap-2 px-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </SidebarGroup>
    ),
    Errored: (error) => (
      <SidebarGroup>
        <div className="mx-2 flex flex-col gap-1 rounded-lg border border-dashed border-sidebar-border p-4 text-center">
          <p className="text-sm font-medium text-destructive">
            Failed to load your projects
          </p>
          <p className="text-xs text-muted-foreground">
            {getErrorMessage(error)}
          </p>
        </div>
      </SidebarGroup>
    ),
    Empty: <NoProjectsCard />,
    Success: () =>
      activeProject ? (
        <SidebarGroup>
          <SidebarGroupLabel>Project</SidebarGroupLabel>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href} onClick={() => setOpenMobile(false)}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ) : (
        <></>
      ),
  });
}
