import { APP_URL } from "@/app/_constants/app";
import { SITE_META_DESCRIPTION, SITE_NAME } from "@/app/_constants/seo";
import { FaqSchema } from "@/app/_features/seo/faq-schema";
import { OrganizationSchema } from "@/app/_features/seo/organization-schema";
import { WebSiteSchema } from "@/app/_features/seo/website-schema";
import type { Metadata } from "next";

import { BeforeAfterSection } from "./_features/before-after-section";
import { FaqSection, faqs } from "./_features/faq-section";
import { FinalCtaSection } from "./_features/final-cta-section";
import { HeroSection } from "./_features/hero/hero-section";
import { HowItWorksSection } from "./_features/how-it-works/how-it-works-section";
import { ProblemSection } from "./_features/problem/problem-section";
import { SolutionSection } from "./_features/solution/solution-section";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_META_DESCRIPTION,
  alternates: {
    canonical: APP_URL,
  },
};

export default function Page() {
  return (
    <div>
      <HeroSection />
      <HowItWorksSection />
      <ProblemSection />
      <SolutionSection />
      <BeforeAfterSection />
      <FaqSection />
      <FinalCtaSection />

      <FaqSchema faqs={faqs} />
      <OrganizationSchema />
      <WebSiteSchema />
    </div>
  );
}
