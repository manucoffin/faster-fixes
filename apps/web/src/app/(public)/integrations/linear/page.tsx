import { APP_URL } from "@/app/_constants/app";
import { BreadcrumbSchema } from "@/app/_components/seo/breadcrumb-schema";
import { SoftwareApplicationSchema } from "@/app/(public)/_components/seo/software-application-schema";
import { WebPageSchema } from "@/app/_components/seo/web-page-schema";
import type { Metadata } from "next";
import { LinearBreadcrumb } from "./_features/linear-breadcrumb";
import { LinearCapabilitiesSection } from "./_features/linear-capabilities-section";
import { LinearCtaSection } from "./_features/linear-cta-section";
import { LinearHero } from "./_features/linear-hero";
import { LinearHowItWorksSection } from "./_features/linear-how-it-works-section";

const pageUrl = `${APP_URL}/integrations/linear`;
// Title/meta lead with the outcome (issue creation) over the generic "{Tool} integration" pattern,
// to lift CTR at borderline page-1/2 positions where users compare similarly-ranked tool pages (ChatSEO 2026-07-07).
const title = "Linear Integration: Client Feedback → Linear Issues, Auto";
const description =
  "Client feedback lands in Linear automatically, with screenshot, CSS selector, React component path, and full browser context. No manual triage.";
const ogImageAlt =
  "FasterFixes Linear integration: visual feedback creating a Linear issue with screenshot and dev context attached";
const datePublished = "2026-05-06T00:00:00.000Z";
const dateModified = "2026-05-06T00:00:00.000Z";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: [
    "linear integration visual feedback",
    "client feedback linear issues",
    "staging feedback to linear",
    "bug reporting linear integration",
    "linear issue from feedback widget",
    "bidirectional linear sync",
    "feedback widget linear team",
    "linear issue tracker feedback tool",
  ],
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title,
    description,
    url: pageUrl,
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        alt: ogImageAlt,
      },
    ],
  },
  twitter: {
    title,
    description,
    images: [
      {
        url: "/opengraph-image",
        alt: ogImageAlt,
      },
    ],
  },
};

export default function Page() {
  return (
    <div>
      <LinearBreadcrumb />
      <LinearHero />
      <LinearCapabilitiesSection />
      <LinearHowItWorksSection />
      <LinearCtaSection />

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
          { name: "Integrations", url: `${APP_URL}/integrations/linear` },
          { name: "Linear", url: pageUrl },
        ]}
      />
    </div>
  );
}
