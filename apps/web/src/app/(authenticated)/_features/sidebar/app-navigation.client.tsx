"use client";

import { usePlanGate } from "@/app/_features/subscription/use-plan-gate";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar";
import { Blocks, CreditCard, Settings2, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const applicationItems = [
  { label: "Integrations", href: "/integrations" as const, icon: Blocks },
];

export function AppNavigation() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { isFreePlan } = usePlanGate();

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Application</SidebarGroupLabel>
        <SidebarMenu>
          {applicationItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
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

      <SidebarGroup>
        <SidebarGroupLabel>My Account</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/account/settings")}
              tooltip="Settings"
            >
              <Link
                href="/account/settings"
                onClick={() => setOpenMobile(false)}
              >
                <Settings2 />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/account/billing")}
              tooltip={isFreePlan ? "Upgrade" : "Billing"}
            >
              <Link
                href="/account/billing"
                onClick={() => setOpenMobile(false)}
              >
                {isFreePlan ? (
                  <Sparkles className="text-amber-500" />
                ) : (
                  <CreditCard />
                )}
                <span>{isFreePlan ? "Upgrade" : "Billing"}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
