import { APP_URL } from "@/app/_constants/app";
import { SITE_NAME } from "@/app/_constants/seo";
import { BreadcrumbSchema } from "@/app/_features/seo/breadcrumb-schema";
import { FaqSchema } from "@/app/_features/seo/faq-schema";
import { HowToSchema } from "@/app/_features/seo/how-to-schema";
import { WebPageSchema } from "@/app/_features/seo/web-page-schema";
import type { Metadata } from "next";
import { MarkerIoBreadcrumb } from "./_features/marker-io-breadcrumb";
import { MarkerIoComparisonSection } from "./_features/marker-io-comparison-section";
import { MarkerIoCtaSection } from "./_features/marker-io-cta-section";
import { MarkerIoDeveloperFirstSection } from "./_features/marker-io-developer-first-section";
import {
  MarkerIoFaqSection,
  markerIoFaqs,
} from "./_features/marker-io-faq-section";
import { MarkerIoHero } from "./_features/marker-io-hero";
import { MarkerIoHonestTakeSection } from "./_features/marker-io-honest-take-section";
import {
  MarkerIoMigrationSection,
  migrationSteps,
} from "./_features/marker-io-migration-section";
import { MarkerIoPricingSection } from "./_features/marker-io-pricing-section";
import { MarkerIoWhySwitchSection } from "./_features/marker-io-why-switch-section";

const pageUrl = `${APP_URL}/vs/marker-io`;
const title = `Marker.io alternative · Open-source feedback widget · ${SITE_NAME}`;
const description =
  "FasterFixes is the open-source, self-hostable Marker.io alternative for developer teams. Free when self-hosted, flat-rate when hosted, and shipped with an MCP server for Claude Code, Cursor, and Codex.";
const datePublished = "2026-04-26T00:00:00.000Z";
const dateModified = "2026-04-26T00:00:00.000Z";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: [
    "Marker.io alternative",
    "Marker.io free alternative",
    "Marker.io open source alternative",
    "self-hosted Marker.io alternative",
    "FOSS Marker.io",
    "Marker.io vs FasterFixes",
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
      <MarkerIoBreadcrumb />
      <MarkerIoHero />
      <MarkerIoWhySwitchSection />
      <MarkerIoHonestTakeSection />
      <MarkerIoDeveloperFirstSection />
      <MarkerIoComparisonSection />
      <MarkerIoPricingSection />
      <MarkerIoMigrationSection />
      <MarkerIoFaqSection />
      <MarkerIoCtaSection />

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
          { name: "Compare", url: `${APP_URL}/vs/marker-io` },
          { name: "Marker.io alternative", url: pageUrl },
        ]}
      />
      <HowToSchema
        name="How to switch from Marker.io to FasterFixes"
        description="Migrate client feedback from Marker.io to FasterFixes in four steps."
        steps={migrationSteps.map((step) => ({
          name: step.label,
          text: step.body,
        }))}
      />
      <FaqSchema faqs={markerIoFaqs} />
    </div>
  );
}
