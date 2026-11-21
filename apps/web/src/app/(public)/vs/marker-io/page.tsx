import { APP_URL } from "@/app/_constants/app";
import { BreadcrumbSchema } from "@/app/_components/seo/breadcrumb-schema";
import { FaqSchema } from "@/app/_components/seo/faq-schema";
import { HowToSchema } from "@/app/_components/seo/how-to-schema";
import { SoftwareApplicationSchema } from "@/app/(public)/_components/seo/software-application-schema";
import { WebPageSchema } from "@/app/_components/seo/web-page-schema";
import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { COMPETITOR_PRICES } from "@/app/(public)/_helpers/competitor-prices";
import { formatAmount } from "@/app/(public)/_helpers/format-competitor-price";
import { buildSocialMetadata } from "@/app/(public)/_helpers/build-social-metadata";
import type { Metadata } from "next";
import { MarkerIoComparisonSection } from "./_features/marker-io-comparison-section";
import { MarkerIoCtaSection } from "./_features/marker-io-cta-section";
import { markerIoFaqs } from "./_features/marker-io-faqs";
import { MarkerIoFitSection } from "./_features/marker-io-fit-section";
import { MarkerIoHero } from "./_features/marker-io-hero";
import {
  MarkerIoMigrationSection,
  migrationSteps,
} from "./_features/marker-io-migration-section";
import { MarkerIoPricingSection } from "./_features/marker-io-pricing-section";
import { MarkerIoWhatIsSection } from "./_features/marker-io-what-is-section";
import { VsCrossLinks } from "../_features/vs-cross-links";
import { VsFaqSection } from "../_features/vs-faq-section";

const { starter } = COMPETITOR_PRICES.markerIo.plans;
const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];

const pageUrl = `${APP_URL}/vs/marker-io`;
const title = "Marker.io Alternative: Open-Source, Self-Hosted, Flat Price";
const description = `Marker.io starts at ${formatAmount(starter.billedYearlyAmount, starter.currency)}/mo for ${starter.seats} seats. FasterFixes is an open-source feedback widget, $0 self-hosted or $${proPrice}/mo for ${proPlan.seats} members, with MCP for Claude Code and Cursor.`;
const datePublished = "2026-04-26T00:00:00.000Z";
const dateModified = "2026-11-21T00:00:00.000Z";

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
  ...buildSocialMetadata({
    path: "/vs/marker-io",
    title,
    description,
  }),
};

export default function Page() {
  return (
    <div>
      <MarkerIoHero />
      <MarkerIoComparisonSection />
      <MarkerIoPricingSection />
      <MarkerIoWhatIsSection />
      <MarkerIoFitSection />
      <MarkerIoMigrationSection />
      <VsFaqSection faqs={markerIoFaqs} />
      <MarkerIoCtaSection />
      <VsCrossLinks currentSlug="marker-io" />

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
