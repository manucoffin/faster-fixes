import { AppLogoMark } from "@/app/_features/core/logo/app-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import { Blocks, CreditCard, Settings2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
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

        <SidebarGroup>
          <SidebarGroupLabel>Organization</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/integrations">
                <SidebarMenuButton tooltip="Integrations">
                  <Blocks />
                  <span>Integrations</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>My Account</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/account/settings">
                <SidebarMenuButton tooltip="Settings">
                  <Settings2 />
                  <span>Settings</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <Link href="/account/billing">
                <SidebarMenuButton tooltip="Billing">
                  <CreditCard />
                  <span>Billing</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarUserDropdown />
      </SidebarFooter>
    </Sidebar>
  );
};
