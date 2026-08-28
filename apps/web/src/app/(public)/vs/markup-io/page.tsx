import { APP_URL } from "@/app/_constants/app";
import { SITE_NAME } from "@/app/_constants/seo";
import { BreadcrumbSchema } from "@/app/_features/seo/breadcrumb-schema";
import { FaqSchema } from "@/app/_features/seo/faq-schema";
import { SoftwareApplicationSchema } from "@/app/_features/seo/software-application-schema";
import { WebPageSchema } from "@/app/_features/seo/web-page-schema";
import type { Metadata } from "next";
import { VsCrossLinks } from "../_features/vs-cross-links";
import { MarkupIoBreadcrumb } from "./_features/markup-io-breadcrumb";
import { MarkupIoCapabilitiesSection } from "./_features/markup-io-capabilities-section";
import { MarkupIoComparisonSection } from "./_features/markup-io-comparison-section";
import { MarkupIoCtaSection } from "./_features/markup-io-cta-section";
import {
  MarkupIoFaqSection,
  markupIoFaqs,
} from "./_features/markup-io-faq-section";
import { MarkupIoHero } from "./_features/markup-io-hero";
import { MarkupIoHonestTakeSection } from "./_features/markup-io-honest-take-section";
import { MarkupIoPricingSection } from "./_features/markup-io-pricing-section";
import { MarkupIoWhySwitchSection } from "./_features/markup-io-why-switch-section";

const pageUrl = `${APP_URL}/vs/markup-io`;
const title = `Markup.io Alternative — Open-Source & Developer-First | ${SITE_NAME}`;
const description =
  "Markup.io raised prices 172% and killed its free plan. FasterFixes is open-source, self-hostable, $20/mo — feedback flows to Claude Code, Cursor, Linear, and Jira.";
const datePublished = "2026-05-12T00:00:00.000Z";
const dateModified = "2026-05-12T00:00:00.000Z";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: [
    "markup.io alternative",
    "markup io alternative",
    "markup.io free alternative",
    "markup.io open source alternative",
    "markup.io vs faster fixes",
    "open source visual feedback tool",
    "self-hosted feedback widget",
    "visual feedback tool for developers",
    "MCP server bug reporting",
    "markup.io competitor",
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
      <MarkupIoBreadcrumb />
      <MarkupIoHero />
      <MarkupIoWhySwitchSection />
      <MarkupIoComparisonSection />
      <MarkupIoCapabilitiesSection />
      <MarkupIoPricingSection />
      <MarkupIoHonestTakeSection />
      <MarkupIoFaqSection />
      <MarkupIoCtaSection />
      <VsCrossLinks currentSlug="markup-io" />

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
          { name: "Markup.io alternative", url: pageUrl },
        ]}
      />
      <FaqSchema faqs={markupIoFaqs} />
    </div>
  );
}
