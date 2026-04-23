import { APP_URL } from "@/app/_constants/app";
import {
  SITE_META_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/app/_constants/seo";
import { FaqSchema } from "@/app/_features/seo/faq-schema";
import { OrganizationSchema } from "@/app/_features/seo/organization-schema";
import { SoftwareApplicationSchema } from "@/app/_features/seo/software-application-schema";
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
  title: {
    absolute: `${SITE_NAME} — ${SITE_TAGLINE}`,
  },
  description: SITE_META_DESCRIPTION,
  keywords: [
    "website feedback widget",
    "bug reporting tool",
    "visual feedback tool",
    "client feedback tool",
    "open source feedback widget",
    "feedback widget for Next.js",
    "feedback widget React",
    "MCP server bug tracking",
    "Claude Code feedback",
    "Cursor feedback integration",
    "BugHerd alternative",
    "Marker.io alternative",
    "Usersnap alternative",
    "Userback alternative",
  ],
  alternates: {
    canonical: APP_URL,
  },
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_META_DESCRIPTION,
    url: APP_URL,
  },
  twitter: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_META_DESCRIPTION,
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
      <SoftwareApplicationSchema />
    </div>
  );
}
