import { AppLogo } from "@/app/_features/core/logo/app-logo";
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
import { CreditCard, FolderOpen, Settings2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { OrganizationSwitcher } from "./organization/organization-switcher.client";
import { SidebarUserDropdown } from "./sidebar-user-dropdown.client";

export const AuthenticatedSidebar = async ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <AppLogo className="w-40 p-2" />
        <OrganizationSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/projets">
                <SidebarMenuButton tooltip="Projets">
                  <FolderOpen />
                  <span>My projects</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>My Account</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/mon-compte/parametres">
                <SidebarMenuButton tooltip="Settings">
                  <Settings2 />
                  <span>Settings</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <Link href="/mon-compte/facturation">
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
