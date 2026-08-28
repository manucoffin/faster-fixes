import { APP_URL } from "@/app/_constants/app";
import { SITE_NAME } from "@/app/_constants/seo";
import { BreadcrumbSchema } from "@/app/_features/seo/breadcrumb-schema";
import { FaqSchema } from "@/app/_features/seo/faq-schema";
import { SoftwareApplicationSchema } from "@/app/_features/seo/software-application-schema";
import { WebPageSchema } from "@/app/_features/seo/web-page-schema";
import type { Metadata } from "next";
import { VsCrossLinks } from "../_features/vs-cross-links";
import { GleapBreadcrumb } from "./_features/gleap-breadcrumb";
import { GleapComparisonSection } from "./_features/gleap-comparison-section";
import { GleapCtaSection } from "./_features/gleap-cta-section";
import { GleapFaqSection, gleapFaqs } from "./_features/gleap-faq-section";
import { GleapFeatureCardsSection } from "./_features/gleap-feature-cards-section";
import { GleapHero } from "./_features/gleap-hero";
import { GleapPricingSection } from "./_features/gleap-pricing-section";

const pageUrl = `${APP_URL}/vs/gleap`;
const title = `Gleap Alternative — Open-Source & Dev-First | ${SITE_NAME}`;
const description =
  "FasterFixes is the open-source gleap alternative for dev teams. Self-hostable, MCP server for Claude Code and Cursor, flat $20/mo pricing.";
const datePublished = "2026-05-03T00:00:00.000Z";
const dateModified = "2026-05-03T00:00:00.000Z";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: [
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
      <GleapBreadcrumb />
      <GleapHero />
      <GleapComparisonSection />
      <GleapFeatureCardsSection />
      <GleapPricingSection />
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
          { name: "Gleap alternative", url: pageUrl },
        ]}
      />
      <FaqSchema faqs={gleapFaqs} />
    </div>
  );
}
