import { APP_URL } from "@/app/_constants/app";
import { SITE_NAME } from "@/app/_constants/seo";
import type { Metadata } from "next";
import { ComparisonSection } from "./_features/comparison-section";
import { LicenseSection } from "./_features/license-section";
import { OpenSourceCtaSection } from "./_features/open-source-cta-section";
import { OpenSourceHero } from "./_features/open-source-hero";
import { SelfHostingSection } from "./_features/self-hosting-section";
import { WhyOpenSourceSection } from "./_features/why-open-source-section";

const title = `Open-source feedback widget · Self-hosted · ${SITE_NAME}`;
const description =
  "Open-source, self-hosted feedback widget for developer teams. AGPL-3.0 app, MIT widget packages. Deploy on Vercel, connect Postgres and R2. No per-seat pricing.";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: [
    "open source feedback widget",
    "self-hosted feedback tool",
    "free bug reporting tool",
    "open source bug reporting tool",
    "self-host feedback widget",
    "AGPL feedback tool",
    "BugHerd open source alternative",
    "Marker.io open source alternative",
    "Usersnap open source alternative",
  ],
  alternates: {
    canonical: `${APP_URL}/open-source`,
  },
  openGraph: {
    title,
    description,
    url: `${APP_URL}/open-source`,
  },
  twitter: {
    title,
    description,
  },
};

export default function Page() {
  return (
    <div>
      <OpenSourceHero />
      <WhyOpenSourceSection />
      <SelfHostingSection />
      <ComparisonSection />
      <LicenseSection />
      <OpenSourceCtaSection />
    </div>
  );
}
