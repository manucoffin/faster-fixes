import { APP_URL } from "@/app/_constants/app";
import { BreadcrumbSchema } from "@/app/_components/seo/breadcrumb-schema";
import { FaqSchema } from "@/app/_components/seo/faq-schema";
import { HowToSchema } from "@/app/_components/seo/how-to-schema";
import { SoftwareApplicationSchema } from "@/app/(public)/_components/seo/software-application-schema";
import { WebPageSchema } from "@/app/_components/seo/web-page-schema";
import { buildSocialMetadata } from "@/app/(public)/_helpers/build-social-metadata";
import type { Metadata } from "next";
import { UsersnapAlternativesSection } from "./_features/usersnap-alternatives-section";
import { UsersnapCalculatorSection } from "./_features/usersnap-calculator-section";
import { UsersnapComparisonSection } from "./_features/usersnap-comparison-section";
import { UsersnapCtaSection } from "./_features/usersnap-cta-section";
import { UsersnapEditorSection } from "./_features/usersnap-editor-section";
import { usersnapFaqs } from "./_features/usersnap-faqs";
import { UsersnapFitSection } from "./_features/usersnap-fit-section";
import { UsersnapHero } from "./_features/usersnap-hero";
import { UsersnapHonestTakeSection } from "./_features/usersnap-honest-take-section";
import {
  UsersnapMigrationSection,
  migrationSteps,
} from "./_features/usersnap-migration-section";
import { UsersnapPricingSection } from "./_features/usersnap-pricing-section";
import { VsCrossLinks } from "../_features/vs-cross-links";
import { VsFaqSection } from "../_features/vs-faq-section";

const pageUrl = `${APP_URL}/vs/usersnap`;
const title = "Usersnap alternatives: 9 tools compared (2026)";
const description =
  "Usersnap alternatives: nine tools compared on price, free plan and self-hosting, including an open-source option you can host yourself for $0.";
const datePublished = "2026-04-27T00:00:00.000Z";
const dateModified = "2026-11-19T00:00:00.000Z";

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
      <UsersnapHero />
      <UsersnapAlternativesSection />
      <UsersnapFitSection />
      <UsersnapEditorSection />
      <UsersnapPricingSection />
      <UsersnapCalculatorSection />
      <UsersnapHonestTakeSection />
      <UsersnapComparisonSection />
      <UsersnapMigrationSection />
      <VsFaqSection faqs={usersnapFaqs} />
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
