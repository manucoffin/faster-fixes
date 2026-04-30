import { APP_URL } from "@/app/_constants/app";
import { SITE_NAME } from "@/app/_constants/seo";
import { BreadcrumbSchema } from "@/app/_features/seo/breadcrumb-schema";
import { FaqSchema } from "@/app/_features/seo/faq-schema";
import { HowToSchema } from "@/app/_features/seo/how-to-schema";
import { SoftwareApplicationSchema } from "@/app/_features/seo/software-application-schema";
import { WebPageSchema } from "@/app/_features/seo/web-page-schema";
import type { Metadata } from "next";
import { AtarimAlternativesSection } from "./_features/atarim-alternatives-section";
import { AtarimBreadcrumb } from "./_features/atarim-breadcrumb";
import { AtarimCalculatorSection } from "./_features/atarim-calculator-section";
import { AtarimComparisonSection } from "./_features/atarim-comparison-section";
import { AtarimCtaSection } from "./_features/atarim-cta-section";
import { AtarimDeveloperFirstSection } from "./_features/atarim-developer-first-section";
import {
  AtarimFaqSection,
  atarimFaqs,
} from "./_features/atarim-faq-section";
import { AtarimFitSection } from "./_features/atarim-fit-section";
import { AtarimHero } from "./_features/atarim-hero";
import { AtarimHonestTakeSection } from "./_features/atarim-honest-take-section";
import {
  AtarimMigrationSection,
  migrationSteps,
} from "./_features/atarim-migration-section";
import { AtarimPricingSection } from "./_features/atarim-pricing-section";
import { AtarimWhatIsSection } from "./_features/atarim-what-is-section";
import { AtarimWhySwitchSection } from "./_features/atarim-why-switch-section";

const pageUrl = `${APP_URL}/vs/atarim`;
const title = `Atarim Alternative — Open-Source & Self-Hosted | ${SITE_NAME}`;
const description =
  "Open-source, self-hostable, and flat-priced. FasterFixes gives dev teams structured bug reports with React component tree capture and an MCP server for AI coding agents — without per-seat pricing or vendor lock-in.";
const datePublished = "2026-04-30T00:00:00.000Z";
const dateModified = "2026-04-30T00:00:00.000Z";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: [
    "Atarim alternative",
    "Atarim open source alternative",
    "Atarim free alternative",
    "self-hosted Atarim alternative",
    "FOSS Atarim",
    "Atarim vs FasterFixes",
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
      <AtarimBreadcrumb />
      <AtarimHero />
      <AtarimWhatIsSection />
      <AtarimWhySwitchSection />
      <AtarimHonestTakeSection />
      <AtarimFitSection />
      <AtarimCalculatorSection />
      <AtarimAlternativesSection />
      <AtarimDeveloperFirstSection />
      <AtarimComparisonSection />
      <AtarimPricingSection />
      <AtarimMigrationSection />
      <AtarimFaqSection />
      <AtarimCtaSection />

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
          { name: "Compare", url: `${APP_URL}/vs/atarim` },
          { name: "Atarim alternative", url: pageUrl },
        ]}
      />
      <HowToSchema
        name="How to switch from Atarim to FasterFixes"
        description="Migrate client feedback from Atarim to FasterFixes in four steps."
        steps={migrationSteps.map((step) => ({
          name: step.label,
          text: step.body,
        }))}
      />
      <FaqSchema faqs={atarimFaqs} />
    </div>
  );
}
