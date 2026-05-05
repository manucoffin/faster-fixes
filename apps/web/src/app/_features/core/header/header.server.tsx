import { signupUrl } from "@/app/_constants/routes";
import { AppLogo } from "@/app/_features/core/logo/app-logo";
import { auth } from "@/server/auth";
import { isCloud } from "@/utils/environment/env";
import { AnimatedText } from "@workspace/ui/components/animated-text";
import { Button } from "@workspace/ui/components/button";
import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@workspace/ui/components/navigation-menu";
import { headers } from "next/headers";
import Link from "next/link";
import { MobileNav } from "./mobile-nav.client";
import { ThemeToggle } from "./theme-toggle.client";

const GITHUB_REPO_URL = "https://github.com/manucoffin/faster-fixes";

const leadingNavLinks = [
  { href: "/docs", label: "Documentation" },
] satisfies { href: string; label: string }[];

const trailingNavLinks = [
  { href: "/pricing", label: "Pricing" },
  // { href: "/open-source", label: "Open source" },
  // { href: "/blog", label: "Blog" },
] satisfies { href: string; label: string }[];

const navLinks = [...leadingNavLinks, ...trailingNavLinks];

const integrationLinks = [
  {
    href: "/integrations/github",
    label: "GitHub",
    description: "Auto-create issues from feedback, sync status both ways.",
  },
] satisfies { href: string; label: string; description: string }[];

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
              <MobileNav
                links={navLinks}
                integrationLinks={integrationLinks}
              />
            </div>
          )}
          <AppLogo className="hidden shrink-0 md:flex" />
        </div>

        {/* Center: logo on mobile, nav on desktop */}
        <div className="flex justify-center">
          <AppLogo className="shrink-0 md:hidden" />
          {isCloud() && (
            <NavigationMenu className="hidden md:flex" viewport={false}>
              <NavigationMenuList className="gap-8">
                {leadingNavLinks.map((link) => (
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
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent px-0 text-sm font-normal hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent data-[state=open]:hover:bg-transparent data-[state=open]:focus:bg-transparent">
                    Integrations
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[300px] gap-1 p-2">
                      {integrationLinks.map((link) => (
                        <li key={link.href}>
                          <NavigationMenuLink asChild>
                            <Link href={link.href as never}>
                              <span className="text-sm font-medium">
                                {link.label}
                              </span>
                              <span className="text-muted-foreground line-clamp-2 text-xs leading-snug">
                                {link.description}
                              </span>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                {trailingNavLinks.map((link) => (
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
