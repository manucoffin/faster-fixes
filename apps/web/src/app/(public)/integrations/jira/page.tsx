import { APP_URL } from "@/app/_constants/app";
import { BreadcrumbSchema } from "@/app/_components/seo/breadcrumb-schema";
import { SoftwareApplicationSchema } from "@/app/_components/seo/software-application-schema";
import { WebPageSchema } from "@/app/_components/seo/web-page-schema";
import type { Metadata } from "next";
import { JiraBreadcrumb } from "./_features/jira-breadcrumb";
import { JiraCapabilitiesSection } from "./_features/jira-capabilities-section";
import { JiraCtaSection } from "./_features/jira-cta-section";
import { JiraHero } from "./_features/jira-hero";
import { JiraHowItWorksSection } from "./_features/jira-how-it-works-section";

const pageUrl = `${APP_URL}/integrations/jira`;
// Title/meta lead with the job-to-be-done, and the meta surfaces category-based sync as the
// differentiator: Userback, Marker.io and BugHerd all title on "{Tool} + Jira" and claim generic
// "2-way sync" without saying how it survives custom workflows (ChatSEO 2026-07-19).
const title = "Client Feedback → Jira Issues, Synced by Status Category";
const description =
  "Turn client feedback into Jira issues with screenshot links, component paths, and diagnostics. Status sync tracks Jira's category, not name — works with any workflow.";
const ogImageAlt =
  "Faster Fixes feedback panel showing a linked Jira issue with status category sync";
const datePublished = "2026-07-19T00:00:00.000Z";
const dateModified = "2026-07-19T00:00:00.000Z";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: [
    "jira integration client feedback",
    "jira bug tracking screenshot",
    "jira issue from bug report",
    "jira status sync custom workflow",
    "visual feedback jira cloud",
    "jira oauth bug tracker",
    "jira adf issue formatting",
    "automatic jira issue creation",
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
      <JiraBreadcrumb />
      <JiraHero />
      <JiraCapabilitiesSection />
      <JiraHowItWorksSection />
      <JiraCtaSection />

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
          { name: "Integrations", url: `${APP_URL}/integrations/jira` },
          { name: "Jira", url: pageUrl },
        ]}
      />
    </div>
  );
}
