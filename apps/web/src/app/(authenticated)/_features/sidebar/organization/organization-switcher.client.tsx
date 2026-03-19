"use client";

import {
  organization,
  useActiveOrganization,
  useListOrganizations,
} from "@/lib/auth";
import { resolveS3Url } from "@/server/storage/resolve-s3-url";
import { getInitials } from "@/utils/text/get-initials";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Check, ChevronsUpDown, Mail, Plus, Settings2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { CreateOrganizationDialog } from "./create-organization-dialog.client";

function OrganizationSwitcherLoading() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="cursor-default">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="grid flex-1 gap-1.5 text-left text-sm leading-tight">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function OrganizationSwitcher() {
  const { data: activeOrg, isPending: isActiveOrgPending } =
    useActiveOrganization();
  const { data: organizations, isPending: isListPending } =
    useListOrganizations();
  const { isMobile } = useSidebar();
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  if (isActiveOrgPending || isListPending) {
    return <OrganizationSwitcherLoading />;
  }

  const orgName = activeOrg?.name ?? "organization";
  const orgLogo = (activeOrg as Record<string, unknown>)?.logo as
    | string
    | undefined;

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  {orgLogo && (
                    <AvatarImage src={resolveS3Url(orgLogo)} alt={orgName} />
                  )}
                  <AvatarFallback className="rounded-lg text-xs">
                    {getInitials(orgName)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{orgName}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {activeOrg?.slug}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="start"
              sideOffset={4}
            >
              <DropdownMenuLabel>Organizations</DropdownMenuLabel>
              <DropdownMenuGroup>
                {organizations?.map((org) => {
                  const orgAny = org as Record<string, unknown>;
                  const logo = orgAny.logo as string | undefined;
                  return (
                    <DropdownMenuItem
                      key={org.id}
                      onSelect={() =>
                        organization.setActive({ organizationId: org.id })
                      }
                      className="flex items-center gap-2"
                    >
                      <Avatar className="h-6 w-6 rounded-md">
                        {logo && (
                          <AvatarImage
                            src={resolveS3Url(logo)}
                            alt={org.name}
                            className="object-cover"
                          />
                        )}
                        <AvatarFallback className="rounded-md text-[10px]">
                          {getInitials(org.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate">{org.name}</span>
                      {org.id === activeOrg?.id && (
                        <Check className="text-muted-foreground size-4" />
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 size-4" />
                Create organization
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/organization" className="flex items-center">
                  <Settings2 className="mr-2 size-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/organization/invitations"
                  className="flex items-center"
                >
                  <Mail className="mr-2 size-4" />
                  My invitations
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <CreateOrganizationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
