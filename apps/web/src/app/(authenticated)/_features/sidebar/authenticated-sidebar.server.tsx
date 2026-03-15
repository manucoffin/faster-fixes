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
import { CreditCard, Settings2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { OrganizationSwitcher } from "./organization-switcher.client";
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
          <SidebarGroupLabel>Mon compte</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/mon-compte/parametres">
                <SidebarMenuButton tooltip="Paramètres">
                  <Settings2 />
                  <span>Paramètres</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <Link href="/mon-compte/facturation">
                <SidebarMenuButton tooltip="Facturation">
                  <CreditCard />
                  <span>Facturation</span>
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
