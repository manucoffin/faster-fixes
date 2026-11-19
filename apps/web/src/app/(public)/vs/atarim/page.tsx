import { PLAN_PRICES, SubscriptionPlanName } from "@/app/_domains/subscription";
import { APP_URL } from "@/app/_constants/app";
import { BreadcrumbSchema } from "@/app/_components/seo/breadcrumb-schema";
import { FaqSchema } from "@/app/_components/seo/faq-schema";
import { HowToSchema } from "@/app/_components/seo/how-to-schema";
import { SoftwareApplicationSchema } from "@/app/(public)/_components/seo/software-application-schema";
import { WebPageSchema } from "@/app/_components/seo/web-page-schema";
import { buildSocialMetadata } from "@/app/(public)/_helpers/build-social-metadata";
import type { Metadata } from "next";
import { AtarimAlternativesSection } from "./_features/atarim-alternatives-section";
import { AtarimBreadcrumb } from "./_features/atarim-breadcrumb";
import { AtarimCalculatorSection } from "./_features/atarim-calculator-section";
import { AtarimComparisonSection } from "./_features/atarim-comparison-section";
import { AtarimCtaSection } from "./_features/atarim-cta-section";
import { AtarimDeveloperFirstSection } from "./_features/atarim-developer-first-section";
import { AtarimFaqSection, atarimFaqs } from "./_features/atarim-faq-section";
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
import { VsCrossLinks } from "../_features/vs-cross-links";

const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];

const pageUrl = `${APP_URL}/vs/atarim`;
const title = "Atarim alternatives: 9 tools compared (2026)";
const description = `Nine Atarim alternatives compared on price, free plans and self-hosting. Atarim Pro is $67/mo. FasterFixes is $${proPrice}/mo, or $0 self-hosted.`;
const datePublished = "2026-04-30T00:00:00.000Z";
const dateModified = "2026-11-17T00:00:00.000Z";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: [
    "Atarim alternatives",
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
  ...buildSocialMetadata({
    path: "/vs/atarim",
    title,
    description,
  }),
};

export default function Page() {
  return (
    <div>
      <AtarimBreadcrumb />
      <AtarimHero />
      <AtarimAlternativesSection />
      <AtarimWhatIsSection />
      <AtarimWhySwitchSection />
      <AtarimHonestTakeSection />
      <AtarimFitSection />
      <AtarimCalculatorSection />
      <AtarimDeveloperFirstSection />
      <AtarimComparisonSection />
      <AtarimPricingSection />
      <AtarimMigrationSection />
      <AtarimFaqSection />
      <AtarimCtaSection />
      <VsCrossLinks currentSlug="atarim" />

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
          { name: "Atarim alternatives", url: pageUrl },
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
