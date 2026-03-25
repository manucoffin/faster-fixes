import { APP_URL } from "@/app/_constants/app";
import { SITE_META_DESCRIPTION, SITE_NAME } from "@/app/_constants/seo";
import { OrganizationSchema } from "@/app/_features/seo/organization-schema";
import { WebSiteSchema } from "@/app/_features/seo/website-schema";
import type { Metadata } from "next";

import { AgentWorkflowSection } from "./_features/agent-workflow-section";
import { BeforeAfterSection } from "./_features/before-after-section";
import { FaqSection } from "./_features/faq-section";
import { FinalCtaSection } from "./_features/final-cta-section";
import { HeroSection } from "./_features/hero-section";
import { HowItWorksSection } from "./_features/how-it-works-section";
import { ProblemSection } from "./_features/problem-section";
import { ReframeSection } from "./_features/reframe-section";
import { StackSection } from "./_features/stack-section";

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
      <ReframeSection />
      <BeforeAfterSection />
      <AgentWorkflowSection />
      <StackSection />
      <FaqSection />
      <FinalCtaSection />

      <OrganizationSchema />
      <WebSiteSchema />
    </div>
  );
}
