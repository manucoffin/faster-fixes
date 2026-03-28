import { signupUrl } from "@/app/_constants/routes";
import { AppLogo } from "@/app/_features/core/logo/app-logo";
import { auth } from "@/server/auth";
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
import { ThemeToggle } from "./theme-toggle.client";

const GITHUB_REPO_URL = "https://github.com/manucoffin/faster-fixes";

const navLinks = [
  { href: "/docs", label: "Documentation" },
  { href: "/pricing", label: "Pricing" },
  // { href: "/blog", label: "Blog" },
];

export async function Header() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <header className="border-border/40 bg-background sticky top-0 z-40 border-b">
      <div className="flex h-16 items-center justify-between gap-4 px-4">
        {/* Logo - Left */}
        <AppLogo className="shrink-0" />

        {/* Navigation - Center */}
        <div className="hidden flex-1 justify-center md:flex">
          <NavigationMenu>
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
        </div>

        {/* Actions - Right */}
        <div className="flex shrink-0 items-center gap-2">
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
