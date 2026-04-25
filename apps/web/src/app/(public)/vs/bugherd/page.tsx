import { APP_URL } from "@/app/_constants/app";
import { SITE_NAME } from "@/app/_constants/seo";
import { BreadcrumbSchema } from "@/app/_features/seo/breadcrumb-schema";
import { FaqSchema } from "@/app/_features/seo/faq-schema";
import { HowToSchema } from "@/app/_features/seo/how-to-schema";
import { WebPageSchema } from "@/app/_features/seo/web-page-schema";
import type { Metadata } from "next";
import { BugherdBreadcrumb } from "./_features/bugherd-breadcrumb";
import { BugherdComparisonSection } from "./_features/bugherd-comparison-section";
import { BugherdCtaSection } from "./_features/bugherd-cta-section";
import { BugherdDeveloperFirstSection } from "./_features/bugherd-developer-first-section";
import {
  BugherdFaqSection,
  bugherdFaqs,
} from "./_features/bugherd-faq-section";
import { BugherdHero } from "./_features/bugherd-hero";
import { BugherdHonestTakeSection } from "./_features/bugherd-honest-take-section";
import {
  BugherdMigrationSection,
  migrationSteps,
} from "./_features/bugherd-migration-section";
import { BugherdPricingSection } from "./_features/bugherd-pricing-section";
import { BugherdWhySwitchSection } from "./_features/bugherd-why-switch-section";

const pageUrl = `${APP_URL}/vs/bugherd`;
const title = `BugHerd alternative · Open-source feedback widget · ${SITE_NAME}`;
const description =
  "FasterFixes is the open-source, self-hostable BugHerd alternative for developer teams. Free when self-hosted, flat-rate when hosted, and shipped with an MCP server for Claude Code, Cursor, and Codex.";
const datePublished = "2026-04-25T00:00:00.000Z";
const dateModified = "2026-04-25T00:00:00.000Z";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: [
    "BugHerd alternative",
    "BugHerd free alternative",
    "BugHerd open source alternative",
    "BugHerd vs FasterFixes",
    "open source bug reporting tool",
    "self-hosted feedback widget",
    "feedback widget for developers",
    "feedback widget for Next.js",
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
      <BugherdBreadcrumb />
      <BugherdHero />
      <BugherdWhySwitchSection />
      <BugherdHonestTakeSection />
      <BugherdDeveloperFirstSection />
      <BugherdComparisonSection />
      <BugherdPricingSection />
      <BugherdMigrationSection />
      <BugherdFaqSection />
      <BugherdCtaSection />

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
          { name: "Compare", url: `${APP_URL}/vs/bugherd` },
          { name: "BugHerd alternative", url: pageUrl },
        ]}
      />
      <HowToSchema
        name="How to switch from BugHerd to FasterFixes"
        description="Migrate client feedback from BugHerd to FasterFixes in four steps."
        steps={migrationSteps.map((step) => ({
          name: step.label,
          text: step.body,
        }))}
      />
      <FaqSchema faqs={bugherdFaqs} />
    </div>
  );
}
