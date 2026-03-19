import { loginUrl } from "@/app/_constants/routes";
import { Facehash } from "@/app/_features/core/avatar/facehash-avatar.client";
import { auth } from "@/server/auth";
import { resolveS3Url } from "@/server/storage/resolve-s3-url";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@workspace/ui/components/navigation-menu";
import { cn } from "@workspace/ui/lib/utils";
import { headers } from "next/headers";
import Link from "next/link";
import { SignOutButton } from "./sign-out-button.client";
import { ThemeToggle } from "./theme-toggle.client";

export async function Header() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userImage = session?.user.image;
  const profilePicture = userImage
    ? userImage.startsWith("http")
      ? userImage
      : resolveS3Url(userImage)
    : null;

  return (
    <header className="border-border bg-background sticky top-0 z-40 border-b">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        {/* Logo - Left */}
        <Link
          href="/"
          className="text-foreground hover:text-accent shrink-0 text-xl font-bold transition-colors"
        >
          StartupMaker
        </Link>

        {/* Navigation - Center */}
        <div className="hidden flex-1 justify-center md:flex">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(navigationMenuTriggerStyle(), "cursor-pointer")}
                >
                  <Link href="/">Home</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* User Menu - Right */}
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle size="icon" variant="ghost" />

          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Avatar className="size-8">
                    {profilePicture && (
                      <AvatarImage
                        src={profilePicture}
                        alt={session.user.name || "User"}
                      />
                    )}
                    <AvatarFallback>
                      <Facehash
                        name={session.user.email ?? session.user.name ?? "User"}
                        size={32}
                      />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <div className="flex flex-col gap-2 p-2">
                  <div className="text-foreground text-sm font-medium">
                    {session.user.name}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {session.user.email}
                  </div>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/account/settings">My Account</Link>
                </DropdownMenuItem>

                {session.user.role === "admin" && (
                  <>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link href="/admin">Dashboard Admin</Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />

                <SignOutButton />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline">
              <Link href={loginUrl}>Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
