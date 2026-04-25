import { signupUrl } from "@/app/_constants/routes";
import { AppLogo } from "@/app/_features/core/logo/app-logo";
import { auth } from "@/server/auth";
import { isCloud } from "@/utils/environment/env";
import { AnimatedText } from "@workspace/ui/components/animated-text";
import { Button } from "@workspace/ui/components/button";
import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@workspace/ui/components/navigation-menu";
import { headers } from "next/headers";
import Link from "next/link";
import { MobileNav } from "./mobile-nav.client";
import { ThemeToggle } from "./theme-toggle.client";

const GITHUB_REPO_URL = "https://github.com/manucoffin/faster-fixes";

const navLinks = [
  { href: "/docs", label: "Documentation" },
  { href: "/pricing", label: "Pricing" },
  // { href: "/open-source", label: "Open source" },
  // { href: "/blog", label: "Blog" },
] satisfies { href: string; label: string }[];

export async function Header() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <header className="border-border/40 bg-background sticky top-0 z-40 border-b">
      <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 px-4">
        {/* Left: hamburger on mobile, logo on desktop */}
        <div className="flex items-center">
          {isCloud() && (
            <div className="md:hidden">
              <MobileNav links={navLinks} />
            </div>
          )}
          <AppLogo className="hidden shrink-0 md:flex" />
        </div>

        {/* Center: logo on mobile, nav on desktop */}
        <div className="flex justify-center">
          <AppLogo className="shrink-0 md:hidden" />
          {isCloud() && (
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList className="gap-8">
                {navLinks.map((link) => (
                  <NavigationMenuItem key={link.href}>
                    <NavigationMenuLink
                      asChild
                      className="rounded-none p-0 hover:bg-transparent focus:bg-transparent data-[active=true]:bg-transparent data-[active=true]:hover:bg-transparent data-[active=true]:focus:bg-transparent"
                    >
                      <Link href={link.href as never} className="text-sm">
                        <AnimatedText>{link.label}</AnimatedText>
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex shrink-0 items-center justify-end gap-2">
          <ThemeToggle size="icon" variant="ghost" />

          <Button asChild variant="ghost" size="icon">
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
            >
              <GithubIcon className="size-5" />
            </a>
          </Button>

          {session ? (
            <Button asChild>
              <Link href="/account">Dashboard</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href={signupUrl}>Get started</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
