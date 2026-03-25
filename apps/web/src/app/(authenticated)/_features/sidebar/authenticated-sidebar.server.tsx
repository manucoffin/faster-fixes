import { AppLogoMark } from "@/app/_features/core/logo/app-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import { ArrowUpRight, BookOpen } from "lucide-react";
import * as React from "react";
import { AppNavigation } from "./app-navigation.client";
import { OrganizationSwitcher } from "./organization/organization-switcher.client";
import { ProjectNavigation } from "./project/project-navigation.client";
import { SidebarUserDropdown } from "./sidebar-user-dropdown.client";

export const AuthenticatedSidebar = async ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <AppLogoMark className="shrink-0 px-1" />
          <OrganizationSwitcher />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <ProjectNavigation />
        <AppNavigation />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Documentation">
              <a href="/docs" target="_blank" rel="noopener noreferrer">
                <BookOpen />
                <span>Documentation</span>
                <ArrowUpRight className="text-muted-foreground size-3.5" />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarUserDropdown />
      </SidebarFooter>
    </Sidebar>
  );
};
