import { signupUrl } from "@/app/_constants/routes";
import { AppLogo } from "@/app/_components/app-logo";
import { auth } from "@/server/auth";
import { isCloud } from "@/utils/environment/env";
import { AnimatedText } from "@workspace/ui/components/animated-text";
import { Button } from "@workspace/ui/components/button";
import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import { JiraIcon } from "@workspace/ui/components/icons/jira-icon";
import { LinearIcon } from "@workspace/ui/components/icons/linear-icon";
import { McpIcon } from "@workspace/ui/components/icons/mcp-icon";
import { SlackIcon } from "@workspace/ui/components/icons/slack-icon";
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
import { ThemeToggle } from "@/app/_components/theme-toggle.client";

const GITHUB_REPO_URL = "https://github.com/manucoffin/faster-fixes";

const leadingNavLinks = [{ href: "/docs", label: "Documentation" }] satisfies {
  href: string;
  label: string;
}[];

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
    icon: <GithubIcon className="size-4 shrink-0" />,
  },
  {
    href: "/integrations/linear",
    label: "Linear",
    description:
      "Auto-create Linear issues from feedback, sync status both ways.",
    icon: <LinearIcon className="size-4 shrink-0" />,
  },
  {
    href: "/integrations/jira",
    label: "Jira",
    description: "Auto-create Jira Cloud issues, sync status both ways.",
    icon: <JiraIcon className="size-4 shrink-0" />,
  },
  {
    href: "/integrations/slack",
    label: "Slack",
    description: "Get notified in Slack when feedback arrives or changes.",
    icon: <SlackIcon className="size-4 shrink-0" />,
  },
  {
    href: "/integrations/mcp",
    label: "MCP server",
    description: "Fetch, fix, and resolve feedback from your coding agent.",
    icon: <McpIcon className="size-4 shrink-0" />,
  },
] satisfies {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}[];

export async function Header() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background">
      <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 px-4">
        {/* Left: hamburger on mobile, logo on desktop */}
        <div className="flex items-center">
          {isCloud() && (
            <div className="md:hidden">
              <MobileNav links={navLinks} integrationLinks={integrationLinks} />
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
                    <ul className="grid w-[320px] gap-1 p-2">
                      {/* Plain Link, not NavigationMenuLink: Radix's FocusGroupItem
                          collection (nav-menu 1.2.14) drops this content's children
                          once the list reaches 4+ items. A styled anchor renders
                          reliably regardless of count. */}
                      {integrationLinks.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href as never}
                            className="flex flex-row items-start gap-3 rounded-sm p-2 transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                          >
                            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
                              {link.icon}
                            </span>
                            <span className="flex flex-col gap-1">
                              <span className="text-sm font-medium">
                                {link.label}
                              </span>
                              <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                                {link.description}
                              </span>
                            </span>
                          </Link>
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
