import { APP_URL } from "@/app/_constants/app";
import { SITE_NAME } from "@/app/_constants/seo";
import { BreadcrumbSchema } from "@/app/_features/seo/breadcrumb-schema";
import { FaqSchema } from "@/app/_features/seo/faq-schema";
import { HowToSchema } from "@/app/_features/seo/how-to-schema";
import { SoftwareApplicationSchema } from "@/app/_features/seo/software-application-schema";
import { WebPageSchema } from "@/app/_features/seo/web-page-schema";
import type { Metadata } from "next";
import { UserbackAlternativesSection } from "./_features/userback-alternatives-section";
import { UserbackBreadcrumb } from "./_features/userback-breadcrumb";
import { UserbackCalculatorSection } from "./_features/userback-calculator-section";
import { UserbackComparisonSection } from "./_features/userback-comparison-section";
import { UserbackCtaSection } from "./_features/userback-cta-section";
import { UserbackDeveloperFirstSection } from "./_features/userback-developer-first-section";
import {
  UserbackFaqSection,
  userbackFaqs,
} from "./_features/userback-faq-section";
import { UserbackFitSection } from "./_features/userback-fit-section";
import { UserbackHero } from "./_features/userback-hero";
import { UserbackHonestTakeSection } from "./_features/userback-honest-take-section";
import {
  UserbackMigrationSection,
  migrationSteps,
} from "./_features/userback-migration-section";
import { UserbackPricingSection } from "./_features/userback-pricing-section";
import { UserbackWhatIsSection } from "./_features/userback-what-is-section";
import { UserbackWhySwitchSection } from "./_features/userback-why-switch-section";
import { VsCrossLinks } from "../_features/vs-cross-links";

const pageUrl = `${APP_URL}/vs/userback`;
const title = `Userback Alternative — Open-Source & Self-Hosted | ${SITE_NAME}`;
const description =
  "Open-source, self-hostable, and flat-priced. FasterFixes gives dev teams structured bug reports with React component tree capture and an MCP server for AI coding agents — without per-seat pricing or vendor lock-in.";
const datePublished = "2026-04-29T00:00:00.000Z";
const dateModified = "2026-04-29T00:00:00.000Z";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: [
    "Userback alternative",
    "Userback open source alternative",
    "Userback free alternative",
    "self-hosted Userback alternative",
    "FOSS Userback",
    "Userback vs FasterFixes",
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
      <UserbackBreadcrumb />
      <UserbackHero />
      <UserbackWhatIsSection />
      <UserbackWhySwitchSection />
      <UserbackHonestTakeSection />
      <UserbackFitSection />
      <UserbackCalculatorSection />
      <UserbackAlternativesSection />
      <UserbackDeveloperFirstSection />
      <UserbackComparisonSection />
      <UserbackPricingSection />
      <UserbackMigrationSection />
      <UserbackFaqSection />
      <UserbackCtaSection />
      <VsCrossLinks currentSlug="userback" />

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
          { name: "Userback alternative", url: pageUrl },
        ]}
      />
      <HowToSchema
        name="How to switch from Userback to FasterFixes"
        description="Migrate client feedback from Userback to FasterFixes in four steps."
        steps={migrationSteps.map((step) => ({
          name: step.label,
          text: step.body,
        }))}
      />
      <FaqSchema faqs={userbackFaqs} />
    </div>
  );
}
