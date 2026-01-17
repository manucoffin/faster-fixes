import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@workspace/ui/components/navigation-menu";
import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle.client";

export async function Header() {
  return (
    <header className="border-b border-border bg-background sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 h-16 max-w-7xl mx-auto gap-4">
        {/* Logo - Left */}
        <Link
          href="/"
          className="font-bold text-xl text-foreground hover:text-accent transition-colors shrink-0"
        >
          ManuDev
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
                  <Link href="/mvp-turbo">MVP Turbo</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(navigationMenuTriggerStyle(), "cursor-pointer")}
                >
                  <Link href="/stack-startup-2026">Ressources</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* User Menu - Right */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle size="icon" variant="ghost" />
        </div>
      </div>
    </header>
  );
}
