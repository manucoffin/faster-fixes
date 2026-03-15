"use client";

import { useSession } from "@/lib/auth";
import { useSignOut } from "@/lib/auth/use-sign-out";
import { resolveS3Url } from "@/server/storage/resolve-s3-url";
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
import { Facehash } from "facehash";
import {
  ChevronsUpDown,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings2,
} from "lucide-react";
import Link from "next/link";

export function SidebarUserDropdownLoading() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="cursor-default">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="grid flex-1 gap-1.5 text-left text-sm leading-tight">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function SidebarUserDropdown() {
  const { data: session, isPending } = useSession();
  const { isMobile } = useSidebar();
  const handleSignOut = useSignOut();

  const isAdmin = session?.user.role === "admin";
  const userName =
    session?.user.firstName && session?.user.lastName
      ? `${session?.user.firstName} ${session?.user.lastName}`
      : "User";

  const userImage = session?.user.image;
  const profilePicture = userImage
    ? userImage.startsWith("http")
      ? userImage
      : resolveS3Url(userImage)
    : null;

  if (isPending) {
    return <SidebarUserDropdownLoading />;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {profilePicture ? (
                  <AvatarImage
                    src={profilePicture}
                    alt={userName}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="rounded-lg">
                  <Facehash name={session?.user.email ?? userName} size={32} />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="flex items-center gap-1">
                  <span className="truncate font-semibold">{userName}</span>
                </div>
                <span className="truncate text-xs">{session?.user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {profilePicture ? (
                    <AvatarImage src={profilePicture} alt={userName} />
                  ) : null}
                  <AvatarFallback className="rounded-lg">
                    <Facehash
                      name={session?.user.email ?? userName}
                      size={32}
                    />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="truncate font-semibold">{userName}</span>
                  </div>
                  <span className="truncate text-xs">
                    {session?.user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link
                  href="/mon-compte/parametres"
                  className="flex items-center"
                >
                  <Settings2 className="mr-2 size-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/mon-compte/facturation"
                  className="flex items-center"
                >
                  <CreditCard className="mr-2 size-4" />
                  <span>Billing</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="flex items-center">
                    <LayoutDashboard className="mr-2 size-4" />
                    <span>Dashboard Admin</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem onSelect={handleSignOut} variant="destructive">
              <LogOut className="mr-2 size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
