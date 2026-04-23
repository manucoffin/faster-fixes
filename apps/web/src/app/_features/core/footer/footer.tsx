import { SITE_META_DESCRIPTION } from "@/app/_constants/seo";
import { ManageConsentButton } from "@/app/_features/c15t/manage-consent-button";
import { AnimatedText } from "@workspace/ui/components/animated-text";
import { Route } from "next";
import Link from "next/link";
import { GitHubStarsButton } from "../../github/github-stars-button.client";
import { AppLogo } from "../logo/app-logo";

const productLinks: { text: string; href: string; external?: boolean }[] = [
  { text: "Documentation", href: "/docs" },
  { text: "Pricing", href: "/pricing" },
  { text: "Open source", href: "/open-source" },
  { text: "Support", href: "mailto:support@faster-fixes.com", external: true },
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
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <div className="flex justify-center sm:justify-start">
              <AppLogo />
            </div>

            <p className="text-muted-foreground mx-auto mt-6 max-w-md text-center leading-relaxed sm:mx-0 sm:max-w-xs sm:text-left">
              {SITE_META_DESCRIPTION}
            </p>

            <div className="mt-8 flex justify-center sm:justify-start">
              <GitHubStarsButton />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="text-center sm:text-left">
              <p className="text-lg font-semibold">Product</p>
              <ul className="mt-8 space-y-4 text-sm">
                {productLinks.map(({ text, href, external }) => (
                  <li key={text}>
                    {external ? (
                      <a
                        href={href}
                        className="text-muted-foreground dark:hover:text-primary-foreground hover:text-foreground transition-colors"
                      >
                        <AnimatedText>{text}</AnimatedText>
                      </a>
                    ) : (
                      <Link
                        href={href as Route}
                        className="text-muted-foreground dark:hover:text-primary-foreground hover:text-foreground transition-colors"
                      >
                        <AnimatedText>{text}</AnimatedText>
                      </Link>
                    )}
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
                      className="text-muted-foreground dark:hover:text-primary-foreground hover:text-foreground transition-colors"
                    >
                      <AnimatedText>{text}</AnimatedText>
                    </Link>
                  </li>
                ))}
                <li>
                  <ManageConsentButton className="text-muted-foreground dark:hover:text-primary-foreground hover:text-foreground h-fit px-0 py-0 font-normal transition-colors hover:no-underline">
                    <AnimatedText>Privacy preferences</AnimatedText>
                  </ManageConsentButton>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="border-border/40 mt-12 border-t pt-6 pb-4">
        <div className="mx-auto px-4">
          <div className="text-muted-foreground text-center text-sm sm:flex sm:justify-between sm:text-left">
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
