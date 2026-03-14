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
import { Building2, CreditCard, Mail, Settings2 } from "lucide-react";
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
              <SidebarMenuButton asChild tooltip="Paramètres">
                <Link href="/mon-compte/parametres">
                  <Settings2 />
                  <span>Paramètres</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Organisation">
                <Link href="/mon-compte/organisation">
                  <Building2 />
                  <span>Organisation</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Invitations">
                <Link href="/mon-compte/invitations">
                  <Mail />
                  <span>Invitations</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Facturation">
                <Link href="/mon-compte/facturation">
                  <CreditCard />
                  <span>Facturation</span>
                </Link>
              </SidebarMenuButton>
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
