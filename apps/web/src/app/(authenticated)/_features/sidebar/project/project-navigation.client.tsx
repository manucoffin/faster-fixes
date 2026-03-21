"use client";

import { useActiveProject } from "@/lib/active-project/active-project-provider.client";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import { Inbox, Settings2, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProjectNavigation() {
  const { activeProject } = useActiveProject();
  const pathname = usePathname();

  if (!activeProject) return null;

  const items = [
    { label: "Inbox", href: "/inbox" as const, icon: Inbox },
    { label: "Reviewers", href: "/reviewers" as const, icon: Users },
    { label: "Settings", href: "/settings" as const, icon: Settings2 },
  ];

  return (
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
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
