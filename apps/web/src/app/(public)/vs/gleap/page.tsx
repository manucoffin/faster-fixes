import { APP_URL } from "@/app/_constants/app";
import { BreadcrumbSchema } from "@/app/_components/seo/breadcrumb-schema";
import { FaqSchema } from "@/app/_components/seo/faq-schema";
import { SoftwareApplicationSchema } from "@/app/(public)/_components/seo/software-application-schema";
import { WebPageSchema } from "@/app/_components/seo/web-page-schema";
import { buildSocialMetadata } from "@/app/(public)/_helpers/build-social-metadata";
import type { Metadata } from "next";
import { VsCrossLinks } from "../_features/vs-cross-links";
import { GleapAlternativesSection } from "./_features/gleap-alternatives-section";
import { GleapBreadcrumb } from "./_features/gleap-breadcrumb";
import { GleapComparisonSection } from "./_features/gleap-comparison-section";
import { GleapCtaSection } from "./_features/gleap-cta-section";
import { GleapFaqSection, gleapFaqs } from "./_features/gleap-faq-section";
import { GleapFeatureCardsSection } from "./_features/gleap-feature-cards-section";
import { GleapHero } from "./_features/gleap-hero";
import { GleapHonestTakeSection } from "./_features/gleap-honest-take-section";
import { GleapPricingSection } from "./_features/gleap-pricing-section";

const pageUrl = `${APP_URL}/vs/gleap`;
const title = "Gleap alternatives: 8 tools compared (2026)";
const description = `Gleap now sells AI support. Eight alternatives compared on price, free plans and self-hosting, including one you can run for $0.`;
const datePublished = "2026-05-03T00:00:00.000Z";
const dateModified = "2026-11-17T00:00:00.000Z";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: [
    "gleap alternatives",
    "gleap alternative",
    "open source gleap alternative",
    "gleap free alternative",
    "self-hosted bug reporting tool",
    "gleap vs faster fixes",
    "bug reporting for developers",
    "MCP server bug reporting",
    "react bug reporting widget",
    "gleap competitor",
    "client feedback tool for agencies",
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
      <GleapBreadcrumb />
      <GleapHero />
      <GleapAlternativesSection />
      <GleapComparisonSection />
      <GleapFeatureCardsSection />
      <GleapPricingSection />
      <GleapHonestTakeSection />
      <GleapFaqSection />
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
      <FaqSchema faqs={gleapFaqs} />
    </div>
  );
}
