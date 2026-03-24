import { AppLogoMark } from "@/app/_features/core/logo/app-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@workspace/ui/components/sidebar";
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
        <SidebarUserDropdown />
      </SidebarFooter>
    </Sidebar>
  );
};
