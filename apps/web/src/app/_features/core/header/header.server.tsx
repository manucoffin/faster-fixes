import { loginUrl } from "@/lib/routing";
import { auth } from "@/server/auth";
import { resolveS3Url } from "@/server/storage/resolve-s3-url";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Facehash } from "@/app/_features/core/avatar/facehash-avatar.client";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
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
    <header className="border-b border-border bg-background sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 h-16 container mx-auto gap-4">
        {/* Logo - Left */}
        <Link
          href="/"
          className="font-bold text-xl text-foreground hover:text-accent transition-colors shrink-0"
        >
          StartupMaker
        </Link>

        {/* Navigation - Center */}
        <div className="hidden md:flex flex-1 justify-center">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(navigationMenuTriggerStyle(), "cursor-pointer")}
                >
                  <Link href="/">Accueil</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* User Menu - Right */}
        <div className="flex items-center gap-2 shrink-0">
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
                      <Facehash name={session.user.email ?? session.user.name ?? "User"} size={32} />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <div className="flex flex-col gap-2 p-2">
                  <div className="text-sm font-medium text-foreground">
                    {session.user.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {session.user.email}
                  </div>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/mon-compte/parametres">Mon compte</Link>
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
              <Link href={loginUrl}>Connexion</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
