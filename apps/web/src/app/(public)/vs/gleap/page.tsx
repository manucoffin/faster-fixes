import { APP_URL } from "@/app/_constants/app";
import { BreadcrumbSchema } from "@/app/_components/seo/breadcrumb-schema";
import { FaqSchema } from "@/app/_components/seo/faq-schema";
import { HowToSchema } from "@/app/_components/seo/how-to-schema";
import { SoftwareApplicationSchema } from "@/app/(public)/_components/seo/software-application-schema";
import { WebPageSchema } from "@/app/_components/seo/web-page-schema";
import { buildSocialMetadata } from "@/app/(public)/_helpers/build-social-metadata";
import { COMPETITOR_PRICES } from "@/app/(public)/_helpers/competitor-prices";
import { formatAmount } from "@/app/(public)/_helpers/format-competitor-price";
import type { Metadata } from "next";
import { VsCrossLinks } from "../_features/vs-cross-links";
import { VsFaqSection } from "../_features/vs-faq-section";
import { GleapAlternativesSection } from "./_features/gleap-alternatives-section";
import { GleapComparisonSection } from "./_features/gleap-comparison-section";
import { GleapCtaSection } from "./_features/gleap-cta-section";
import { gleapFaqs } from "./_features/gleap-faqs";
import { GleapFitSection } from "./_features/gleap-fit-section";
import { GleapHero } from "./_features/gleap-hero";
import {
  GleapMigrationSection,
  migrationSteps,
} from "./_features/gleap-migration-section";
import { GleapPlatformSection } from "./_features/gleap-platform-section";
import { GleapPricingSection } from "./_features/gleap-pricing-section";
import { GleapWhatIsSection } from "./_features/gleap-what-is-section";

const gleapHobby = COMPETITOR_PRICES.gleap.plans.hobby;

const pageUrl = `${APP_URL}/vs/gleap`;
const title = "Gleap alternatives: 9 tools compared, one self-hosted for $0";
const description = `Gleap alternatives: nine tools compared on price, free plan and self-hosting. Gleap starts at ${formatAmount(gleapHobby.billedYearlyAmount, gleapHobby.currency)}/mo, no free plan. FasterFixes self-hosts for $0.`;
const datePublished = "2026-05-03T00:00:00.000Z";
const dateModified = "2026-11-24T00:00:00.000Z";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: [
    "Gleap alternatives",
    "Gleap alternative",
    "Gleap open source alternative",
    "Gleap free alternative",
    "self-hosted Gleap alternative",
    "Gleap pricing",
    "Gleap free plan",
    "Gleap MCP",
    "Gleap vs FasterFixes",
    "open source bug reporting tool",
    "feedback widget for developers",
  ],
  alternates: {
    canonical: pageUrl,
  },
  ...buildSocialMetadata({
    path: "/vs/gleap",
    title,
    description,
  }),
};

export default function Page() {
  return (
    <div>
      <GleapHero />
      <GleapAlternativesSection />
      <GleapFitSection />
      <GleapPlatformSection />
      <GleapWhatIsSection />
      <GleapPricingSection />
      <GleapComparisonSection />
      <GleapMigrationSection />
      <VsFaqSection faqs={gleapFaqs} />
      <GleapCtaSection />
      <VsCrossLinks currentSlug="gleap" />

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
          { name: "Gleap alternatives", url: pageUrl },
        ]}
      />
      <HowToSchema
        name="How to switch from Gleap to FasterFixes"
        description="Move website bug reporting from Gleap to FasterFixes in four steps."
        steps={migrationSteps.map((step) => ({
          name: step.label,
          text: step.body,
        }))}
      />
      <FaqSchema faqs={gleapFaqs} />
    </div>
  );
}
