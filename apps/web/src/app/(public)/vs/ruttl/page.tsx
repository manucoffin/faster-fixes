import { APP_URL } from "@/app/_constants/app";
import { SITE_NAME } from "@/app/_constants/seo";
import { BreadcrumbSchema } from "@/app/_features/seo/breadcrumb-schema";
import { FaqSchema } from "@/app/_features/seo/faq-schema";
import { SoftwareApplicationSchema } from "@/app/_features/seo/software-application-schema";
import { WebPageSchema } from "@/app/_features/seo/web-page-schema";
import type { Metadata } from "next";
import { VsCrossLinks } from "../_features/vs-cross-links";
import { RuttlBreadcrumb } from "./_features/ruttl-breadcrumb";
import { RuttlComparisonSection } from "./_features/ruttl-comparison-section";
import { RuttlCtaSection } from "./_features/ruttl-cta-section";
import { RuttlFaqSection, ruttlFaqs } from "./_features/ruttl-faq-section";
import { RuttlFeatureCardsSection } from "./_features/ruttl-feature-cards-section";
import { RuttlHero } from "./_features/ruttl-hero";
import { RuttlHonestTakeSection } from "./_features/ruttl-honest-take-section";
import { RuttlPricingSection } from "./_features/ruttl-pricing-section";
import { RuttlWhySwitchSection } from "./_features/ruttl-why-switch-section";

const pageUrl = `${APP_URL}/vs/ruttl`;
const title = `Ruttl Alternative — Open-Source, No Per-Seat Pricing | ${SITE_NAME}`;
const description =
  "Ruttl charges $18/user/month — $90/mo for a 5-person team. FasterFixes is open-source, self-hostable, flat-rate, with an MCP server for AI coding agents.";
const datePublished = "2026-05-12T00:00:00.000Z";
const dateModified = "2026-05-12T00:00:00.000Z";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: [
    "ruttl alternative",
    "ruttl alternatives",
    "ruttl free alternative",
    "ruttl open source alternative",
    "open source visual feedback tool",
    "self-hosted feedback widget",
    "ruttl vs faster fixes",
    "visual feedback tool for developers",
    "MCP server bug reporting",
    "ruttl competitor",
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
      <RuttlBreadcrumb />
      <RuttlHero />
      <RuttlWhySwitchSection />
      <RuttlComparisonSection />
      <RuttlFeatureCardsSection />
      <RuttlPricingSection />
      <RuttlHonestTakeSection />
      <RuttlFaqSection />
      <RuttlCtaSection />
      <VsCrossLinks currentSlug="ruttl" />

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
          { name: "Ruttl alternative", url: pageUrl },
        ]}
      />
      <FaqSchema faqs={ruttlFaqs} />
    </div>
  );
}
