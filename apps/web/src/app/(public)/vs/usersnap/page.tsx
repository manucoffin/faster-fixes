import { PLAN_PRICES, SubscriptionPlanName } from "@/app/_domains/subscription";
import { APP_URL } from "@/app/_constants/app";
import { BreadcrumbSchema } from "@/app/_components/seo/breadcrumb-schema";
import { FaqSchema } from "@/app/_components/seo/faq-schema";
import { HowToSchema } from "@/app/_components/seo/how-to-schema";
import { SoftwareApplicationSchema } from "@/app/(public)/_components/seo/software-application-schema";
import { WebPageSchema } from "@/app/_components/seo/web-page-schema";
import { buildSocialMetadata } from "@/app/(public)/_helpers/build-social-metadata";
import type { Metadata } from "next";
import { UsersnapAlternativesSection } from "./_features/usersnap-alternatives-section";
import { UsersnapBreadcrumb } from "./_features/usersnap-breadcrumb";
import { UsersnapCalculatorSection } from "./_features/usersnap-calculator-section";
import { UsersnapComparisonSection } from "./_features/usersnap-comparison-section";
import { UsersnapCtaSection } from "./_features/usersnap-cta-section";
import { UsersnapDeveloperFirstSection } from "./_features/usersnap-developer-first-section";
import {
  UsersnapFaqSection,
  usersnapFaqs,
} from "./_features/usersnap-faq-section";
import { UsersnapFitSection } from "./_features/usersnap-fit-section";
import { UsersnapHero } from "./_features/usersnap-hero";
import { UsersnapHonestTakeSection } from "./_features/usersnap-honest-take-section";
import {
  UsersnapMigrationSection,
  migrationSteps,
} from "./_features/usersnap-migration-section";
import { UsersnapPricingSection } from "./_features/usersnap-pricing-section";
import { UsersnapWhySwitchSection } from "./_features/usersnap-why-switch-section";
import { VsCrossLinks } from "../_features/vs-cross-links";

const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];

const pageUrl = `${APP_URL}/vs/usersnap`;
const title = "Usersnap alternatives: 9 tools compared (2026)";
const description = `Nine Usersnap alternatives compared on price, free plans and self-hosting. Usersnap starts at $59/mo for 2 seats. FasterFixes is $${proPrice}/mo.`;
const datePublished = "2026-04-27T00:00:00.000Z";
const dateModified = "2026-11-17T00:00:00.000Z";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: [
    "Usersnap alternatives",
    "Usersnap alternative",
    "Usersnap open source alternative",
    "Usersnap free alternative",
    "self-hosted Usersnap alternative",
    "FOSS Usersnap",
    "Usersnap vs FasterFixes",
    "open source bug reporting tool",
    "self-hosted feedback widget",
    "feedback widget for developers",
    "feedback widget for Next.js",
  ],
  alternates: {
    canonical: pageUrl,
  },
  ...buildSocialMetadata({
    path: "/vs/usersnap",
    title,
    description,
  }),
};

export default function Page() {
  return (
    <div>
      <UsersnapBreadcrumb />
      <UsersnapHero />
      <UsersnapAlternativesSection />
      <UsersnapWhySwitchSection />
      <UsersnapFitSection />
      <UsersnapCalculatorSection />
      <UsersnapHonestTakeSection />
      <UsersnapDeveloperFirstSection />
      <UsersnapComparisonSection />
      <UsersnapPricingSection />
      <UsersnapMigrationSection />
      <UsersnapFaqSection />
      <UsersnapCtaSection />
      <VsCrossLinks currentSlug="usersnap" />

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
          { name: "Usersnap alternatives", url: pageUrl },
        ]}
      />
      <HowToSchema
        name="How to switch from Usersnap to FasterFixes"
        description="Migrate client feedback from Usersnap to FasterFixes in four steps."
        steps={migrationSteps.map((step) => ({
          name: step.label,
          text: step.body,
        }))}
      />
      <FaqSchema faqs={usersnapFaqs} />
    </div>
  );
}
