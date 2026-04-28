import { APP_URL } from "@/app/_constants/app";
import { SITE_NAME } from "@/app/_constants/seo";
import { BreadcrumbSchema } from "@/app/_features/seo/breadcrumb-schema";
import { FaqSchema } from "@/app/_features/seo/faq-schema";
import { HowToSchema } from "@/app/_features/seo/how-to-schema";
import { SoftwareApplicationSchema } from "@/app/_features/seo/software-application-schema";
import { WebPageSchema } from "@/app/_features/seo/web-page-schema";
import type { Metadata } from "next";
import { UsersnapAlternativesSection } from "./_features/usersnap-alternatives-section";
import { UsersnapBreadcrumb } from "./_features/usersnap-breadcrumb";
import { UsersnapComparisonSection } from "./_features/usersnap-comparison-section";
import { UsersnapCtaSection } from "./_features/usersnap-cta-section";
import { UsersnapDeveloperFirstSection } from "./_features/usersnap-developer-first-section";
import {
  UsersnapFaqSection,
  usersnapFaqs,
} from "./_features/usersnap-faq-section";
import { UsersnapFitSection } from "./_features/usersnap-fit-section";
import { UsersnapHero } from "./_features/usersnap-hero";
import { UsersnapHonestTakeSection } from "./_features/usersnap-honest-take-section";
import {
  UsersnapMigrationSection,
  migrationSteps,
} from "./_features/usersnap-migration-section";
import { UsersnapPricingSection } from "./_features/usersnap-pricing-section";
import { UsersnapRelatedComparisons } from "./_features/usersnap-related-comparisons";
import { UsersnapWhySwitchSection } from "./_features/usersnap-why-switch-section";

const pageUrl = `${APP_URL}/vs/usersnap`;
const title = `Usersnap Alternative — Open-Source & Self-Hosted | ${SITE_NAME}`;
const description =
  "Open-source, self-hosted, and free to start. FasterFixes gives dev teams visual bug reports with full technical context — no per-seat pricing, no vendor lock-in. Compare features and pricing.";
const datePublished = "2026-04-27T00:00:00.000Z";
const dateModified = "2026-04-27T00:00:00.000Z";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: [
    "Usersnap alternative",
    "Usersnap open source alternative",
    "Usersnap free alternative",
    "self-hosted Usersnap alternative",
    "FOSS Usersnap",
    "Usersnap vs FasterFixes",
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
      <UsersnapBreadcrumb />
      <UsersnapHero />
      <UsersnapFitSection />
      <UsersnapWhySwitchSection />
      <UsersnapHonestTakeSection />
      <UsersnapAlternativesSection />
      <UsersnapDeveloperFirstSection />
      <UsersnapComparisonSection />
      <UsersnapPricingSection />
      <UsersnapMigrationSection />
      <UsersnapFaqSection />
      <UsersnapRelatedComparisons />
      <UsersnapCtaSection />

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
          { name: "Compare", url: `${APP_URL}/vs/usersnap` },
          { name: "Usersnap alternative", url: pageUrl },
        ]}
      />
      <HowToSchema
        name="How to switch from Usersnap to FasterFixes"
        description="Migrate client feedback from Usersnap to FasterFixes in four steps."
        steps={migrationSteps.map((step) => ({
          name: step.label,
          text: step.body,
        }))}
      />
      <FaqSchema faqs={usersnapFaqs} />
    </div>
  );
}
