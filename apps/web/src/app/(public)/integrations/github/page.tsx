import { APP_URL } from "@/app/_constants/app";
import { SITE_NAME } from "@/app/_constants/seo";
import { BreadcrumbSchema } from "@/app/_features/seo/breadcrumb-schema";
import { HowToSchema } from "@/app/_features/seo/how-to-schema";
import { SoftwareApplicationSchema } from "@/app/_features/seo/software-application-schema";
import { WebPageSchema } from "@/app/_features/seo/web-page-schema";
import type { Metadata } from "next";
import { GithubBreadcrumb } from "./_features/github-breadcrumb";
import { GithubCapabilitiesSection } from "./_features/github-capabilities-section";
import { GithubCtaSection } from "./_features/github-cta-section";
import { GithubHero } from "./_features/github-hero";
import {
  GithubHowItWorksSection,
  githubSetupSteps,
} from "./_features/github-how-it-works-section";

const pageUrl = `${APP_URL}/integrations/github`;
const title = `GitHub integration — Visual feedback to GitHub issues | ${SITE_NAME}`;
const description =
  "Connect Faster Fixes to GitHub. Client feedback creates GitHub issues with screenshot, CSS selector, React component path, and full browser context. Bidirectional status sync included.";
const datePublished = "2026-05-05T00:00:00.000Z";
const dateModified = "2026-05-05T00:00:00.000Z";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: [
    "visual feedback github integration",
    "client feedback github issues",
    "feedback widget github",
    "bug feedback github integration",
    "feedback tool github integration",
    "github issue from feedback",
    "website feedback github",
  ],
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title,
    description,
    url: pageUrl,
    type: "website",
  },
  twitter: {
    title,
    description,
  },
};

export default function Page() {
  return (
    <div>
      <GithubBreadcrumb />
      <GithubHero />
      <GithubCapabilitiesSection />
      <GithubHowItWorksSection />
      <GithubCtaSection />

      <SoftwareApplicationSchema />

      <WebPageSchema
        title={title}
        description={description}
        url={pageUrl}
        datePublished={datePublished}
        dateModified={dateModified}
        aboutId={`${APP_URL}#software`}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: APP_URL },
          { name: "Integrations", url: `${APP_URL}/integrations/github` },
          { name: "GitHub", url: pageUrl },
        ]}
      />
      <HowToSchema
        name="How to connect Faster Fixes to GitHub"
        description="Set up the Faster Fixes GitHub integration in three steps so client feedback creates GitHub issues automatically."
        steps={githubSetupSteps.map((step) => ({
          name: step.label,
          text: step.body,
        }))}
      />
    </div>
  );
}
