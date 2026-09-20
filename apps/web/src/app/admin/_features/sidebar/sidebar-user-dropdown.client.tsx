"use client";

import { useSession } from "@/lib/auth";
import { useSignOut } from "@/lib/auth/use-sign-out";
import { resolveS3Url } from "@/utils/url/resolve-s3-url";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Facehash } from "facehash";
import {
  DropdownMenu,
  DropdownMenuContent,
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
import { ChevronsUpDown, Home, LogOut } from "lucide-react";
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

  const userName =
    session?.user.firstName && session?.user.lastName
      ? `${session?.user.firstName} ${session?.user.lastName}`
      : "User";

  const userImage = session?.user.image;
  // `resolveS3Url` returns an absolute URL untouched, so a stored key and a
  // provider avatar URL both go through it.
  const profilePicture = userImage ? resolveS3Url(userImage) : null;

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
              className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {profilePicture ? (
                  <AvatarImage src={profilePicture} alt={userName} />
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
                  {session?.user.image ? (
                    <AvatarImage src={session.user.image} alt={userName} />
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
            <DropdownMenuItem asChild>
              <Link href="/" className="flex items-center">
                <Home className="mr-2 size-4" />
                <span>Back to site</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={handleSignOut}
              className="text-destructive"
            >
              <LogOut className="mr-2 size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
