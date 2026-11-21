import { APP_URL } from "@/app/_constants/app";
import { SITE_NAME } from "@/app/_constants/seo";
import { PLAN_PRICES, SubscriptionPlanName } from "@/app/_domains/subscription";
import { BreadcrumbSchema } from "@/app/_components/seo/breadcrumb-schema";
import { FaqSchema } from "@/app/_components/seo/faq-schema";
import { SoftwareApplicationSchema } from "@/app/(public)/_components/seo/software-application-schema";
import { WebPageSchema } from "@/app/_components/seo/web-page-schema";
import { buildSocialMetadata } from "@/app/(public)/_helpers/build-social-metadata";
import type { Metadata } from "next";
import { COMPETITOR_PRICES } from "../../_helpers/competitor-prices";
import { formatPrice } from "../../_helpers/format-competitor-price";
import { UserbackAlternativesSection } from "./_features/userback-alternatives-section";
import { UserbackComparisonSection } from "./_features/userback-comparison-section";
import { UserbackCtaSection } from "./_features/userback-cta-section";
import { UserbackDeveloperFirstSection } from "./_features/userback-developer-first-section";
import { userbackFaqs } from "./_features/userback-faqs";
import { UserbackFitSection } from "./_features/userback-fit-section";
import { UserbackHero } from "./_features/userback-hero";
import { UserbackHonestTakeSection } from "./_features/userback-honest-take-section";
import { UserbackMigrationSection } from "./_features/userback-migration-section";
import { UserbackPricingSection } from "./_features/userback-pricing-section";
import { UserbackWhatIsSection } from "./_features/userback-what-is-section";
import { VsCrossLinks } from "../_features/vs-cross-links";
import { VsFaqSection } from "../_features/vs-faq-section";

const pageUrl = `${APP_URL}/vs/userback`;
const title = `Userback Alternative: Open-Source & Self-Hosted | ${SITE_NAME}`;
const { business } = COMPETITOR_PRICES.userback.plans;
const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];
const description = `Userback ${business.name} is ${formatPrice(business)}/mo for ${business.seats} seats. FasterFixes is $0 self-hosted or $${agencyPrice}/mo for unlimited members. Compare features and costs.`;
const datePublished = "2026-04-29T00:00:00.000Z";
const dateModified = "2026-11-21T00:00:00.000Z";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: [
    "Userback alternative",
    "Userback open source alternative",
    "Userback free alternative",
    "self-hosted Userback alternative",
    "FOSS Userback",
    "Userback vs FasterFixes",
    "open source bug reporting tool",
    "self-hosted feedback widget",
    "feedback widget for developers",
    "feedback widget for Next.js",
  ],
  alternates: {
    canonical: pageUrl,
  },
  ...buildSocialMetadata({
    path: "/vs/userback",
    title,
    description,
  }),
};

export default function Page() {
  return (
    <div>
      <UserbackHero />
      <UserbackWhatIsSection />
      <UserbackComparisonSection />
      <UserbackDeveloperFirstSection />
      <UserbackFitSection />
      <UserbackPricingSection />
      <UserbackHonestTakeSection />
      <UserbackAlternativesSection />
      <UserbackMigrationSection />
      <VsFaqSection faqs={userbackFaqs} />
      <UserbackCtaSection />
      <VsCrossLinks currentSlug="userback" />

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
          { name: "Userback alternative", url: pageUrl },
        ]}
      />
      <FaqSchema faqs={userbackFaqs} />
    </div>
  );
}
