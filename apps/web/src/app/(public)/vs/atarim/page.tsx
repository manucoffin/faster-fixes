import { PLAN_PRICES, SubscriptionPlanName } from "@/app/_domains/subscription";
import { APP_URL } from "@/app/_constants/app";
import { BreadcrumbSchema } from "@/app/_components/seo/breadcrumb-schema";
import { FaqSchema } from "@/app/_components/seo/faq-schema";
import { HowToSchema } from "@/app/_components/seo/how-to-schema";
import { SoftwareApplicationSchema } from "@/app/(public)/_components/seo/software-application-schema";
import { WebPageSchema } from "@/app/_components/seo/web-page-schema";
import { buildSocialMetadata } from "@/app/(public)/_helpers/build-social-metadata";
import type { Metadata } from "next";
import { COMPETITOR_PRICES } from "@/app/(public)/_helpers/competitor-prices";
import { formatPrice } from "@/app/(public)/_helpers/format-competitor-price";
import { AtarimAlternativesSection } from "./_features/atarim-alternatives-section";
import { AtarimComparisonSection } from "./_features/atarim-comparison-section";
import { AtarimCtaSection } from "./_features/atarim-cta-section";
import { atarimFaqs } from "./_features/atarim-faqs";
import { AtarimFitSection } from "./_features/atarim-fit-section";
import { AtarimHero } from "./_features/atarim-hero";
import { AtarimIntegrationsSection } from "./_features/atarim-integrations-section";
import {
  AtarimMigrationSection,
  migrationSteps,
} from "./_features/atarim-migration-section";
import { AtarimPricingSection } from "./_features/atarim-pricing-section";
import { AtarimWhatIsSection } from "./_features/atarim-what-is-section";
import { VsCrossLinks } from "../_features/vs-cross-links";
import { VsFaqSection } from "../_features/vs-faq-section";

const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const atarimPro = COMPETITOR_PRICES.atarim.plans.pro;

const pageUrl = `${APP_URL}/vs/atarim`;
const title = "Atarim alternatives: 9 tools compared, one self-hosted for $0";
const description = `Atarim alternatives: nine tools compared on price, free plan and self-hosting. Atarim ${atarimPro.name} is ${formatPrice(atarimPro)}/mo flat. FasterFixes is $${proPrice}/mo, or $0 to self-host.`;
const datePublished = "2026-04-30T00:00:00.000Z";
const dateModified = "2026-11-23T00:00:00.000Z";

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
      <AtarimHero />
      <AtarimAlternativesSection />
      <AtarimFitSection />
      <AtarimIntegrationsSection />
      <AtarimWhatIsSection />
      <AtarimPricingSection />
      <AtarimComparisonSection />
      <AtarimMigrationSection />
      <VsFaqSection faqs={atarimFaqs} />
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
