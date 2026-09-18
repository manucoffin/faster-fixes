import { GitHubStarsButton } from "../_features/github-stars/github-stars-button.client";
import { SITE_META_DESCRIPTION } from "@/app/_constants/seo";
import { ManageConsentButton } from "./manage-consent-button.client";
import { AnimatedText } from "@workspace/ui/components/animated-text";
import { Route } from "next";
import Link from "next/link";
import { AppLogo } from "@/app/_components/app-logo";

const productLinks: { text: string; href: string; external?: boolean }[] = [
  { text: "Documentation", href: "/docs" },
  { text: "Blog", href: "/blog" },
  { text: "Pricing", href: "/pricing" },
  { text: "Open source", href: "/open-source" },
  { text: "Support", href: "mailto:support@faster-fixes.com", external: true },
];

const integrationLinks: { text: string; href: Route }[] = [
  { text: "GitHub integration", href: "/integrations/github" as Route },
  { text: "Linear integration", href: "/integrations/linear" as Route },
  { text: "Jira integration", href: "/integrations/jira" as Route },
  { text: "Slack integration", href: "/integrations/slack" as Route },
  { text: "MCP server", href: "/integrations/mcp" as Route },
];

const alternativesLinks: { text: string; href: Route }[] = [
  { text: "BugHerd alternative", href: "/vs/bugherd" as Route },
  { text: "Marker.io alternative", href: "/vs/marker-io" as Route },
  { text: "Usersnap alternative", href: "/vs/usersnap" as Route },
  { text: "Userback alternative", href: "/vs/userback" as Route },
  { text: "Atarim alternative", href: "/vs/atarim" as Route },
  { text: "Gleap alternative", href: "/vs/gleap" as Route },
  { text: "Ruttl alternative", href: "/vs/ruttl" as Route },
  { text: "Markup.io alternative", href: "/vs/markup-io" as Route },
];

const legalLinks = [
  { text: "Privacy policy", href: "/privacy-policy" as Route },
  { text: "Terms of use", href: "/terms" as Route },
  { text: "Terms of sale", href: "/terms-of-sale" as Route },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full place-self-end border-t">
      <div className="mx-auto px-4 pt-16 pb-6 lg:pt-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_2fr]">
          <div>
            <div className="flex justify-center sm:justify-start">
              <AppLogo />
            </div>

            <p className="mx-auto mt-6 max-w-md text-center leading-relaxed text-muted-foreground sm:mx-0 sm:max-w-xs sm:text-left">
              {SITE_META_DESCRIPTION}
            </p>

            <div className="mt-8 flex justify-center sm:justify-start">
              <GitHubStarsButton />
            </div>

            <div className="mt-4 flex justify-center sm:justify-start md:mt-8">
              <a
                href="https://twelve.tools"
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- external badge served by Twelve Tools */}
                <img
                  src="https://twelve.tools/badge0-dark.svg"
                  alt="Featured on Twelve Tools"
                  width={200}
                  height={54}
                />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center sm:text-left">
              <p className="text-lg font-semibold">Product</p>
              <ul className="mt-8 space-y-4 text-sm">
                {productLinks.map(({ text, href, external }) => (
                  <li key={text}>
                    {external ? (
                      <a
                        href={href}
                        className="text-muted-foreground transition-colors hover:text-foreground dark:hover:text-primary-foreground"
                      >
                        <AnimatedText>{text}</AnimatedText>
                      </a>
                    ) : (
                      <Link
                        href={href as Route}
                        className="text-muted-foreground transition-colors hover:text-foreground dark:hover:text-primary-foreground"
                      >
                        <AnimatedText>{text}</AnimatedText>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center sm:text-left">
              <p className="text-lg font-semibold">Integrations</p>
              <ul className="mt-8 space-y-4 text-sm">
                {integrationLinks.map(({ text, href }) => (
                  <li key={text}>
                    <Link
                      href={href}
                      className="text-muted-foreground transition-colors hover:text-foreground dark:hover:text-primary-foreground"
                    >
                      <AnimatedText>{text}</AnimatedText>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center sm:text-left">
              <p className="text-lg font-semibold">Comparisons</p>
              <ul className="mt-8 space-y-4 text-sm">
                {alternativesLinks.map(({ text, href }) => (
                  <li key={text}>
                    <Link
                      href={href}
                      className="text-muted-foreground transition-colors hover:text-foreground dark:hover:text-primary-foreground"
                    >
                      <AnimatedText>{text}</AnimatedText>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center sm:text-left">
              <p className="text-lg font-semibold">Legal</p>
              <ul className="mt-8 space-y-4 text-sm">
                {legalLinks.map(({ text, href }) => (
                  <li key={text}>
                    <Link
                      href={href}
                      className="text-muted-foreground transition-colors hover:text-foreground dark:hover:text-primary-foreground"
                    >
                      <AnimatedText>{text}</AnimatedText>
                    </Link>
                  </li>
                ))}
                <li>
                  <ManageConsentButton className="h-fit px-0 py-0 font-normal text-muted-foreground transition-colors hover:text-foreground hover:no-underline dark:hover:text-primary-foreground">
                    <AnimatedText>Privacy preferences</AnimatedText>
                  </ManageConsentButton>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 border-t border-border/40 pt-6 pb-4">
        <div className="mx-auto px-4">
          <div className="text-center text-sm text-muted-foreground sm:flex sm:justify-between sm:text-left">
            <p>
              Open source under{" "}
              <a
                href="https://github.com/manucoffin/faster-fixes/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:no-underline"
              >
                AGPL-3.0
              </a>
            </p>

            <p className="mt-4 sm:order-first sm:mt-0">
              &copy; {currentYear} FasterFixes
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
