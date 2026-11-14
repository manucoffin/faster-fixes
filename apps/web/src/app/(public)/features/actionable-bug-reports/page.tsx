import { APP_URL } from "@/app/_constants/app";
import { BreadcrumbSchema } from "@/app/_components/seo/breadcrumb-schema";
import { FaqSchema } from "@/app/_components/seo/faq-schema";
import { SoftwareApplicationSchema } from "@/app/(public)/_components/seo/software-application-schema";
import { WebPageSchema } from "@/app/_components/seo/web-page-schema";
import { TestimonialsSection } from "@/app/_domains/testimonial/testimonials-section/testimonials-section";
import { buildSocialMetadata } from "@/app/(public)/_helpers/build-social-metadata";
import type { Metadata } from "next";
import { ActionableBugReportsCapturedContext } from "./_features/actionable-bug-reports-captured-context";
import { ActionableBugReportsCta } from "./_features/actionable-bug-reports-cta";
import { ActionableBugReportsDestinations } from "./_features/actionable-bug-reports-destinations";
import {
  ActionableBugReportsFaq,
  actionableBugReportsFaqs,
} from "./_features/actionable-bug-reports-faq";
import { ActionableBugReportsHero } from "./_features/actionable-bug-reports-hero";
import { ActionableBugReportsIntro } from "./_features/actionable-bug-reports-intro";
import { ActionableBugReportsRecording } from "./_features/actionable-bug-reports-recording";

const pageUrl = `${APP_URL}/features/actionable-bug-reports`;
// Without the site name suffix: with it, the title overflows the search result width.
const title = "Website bug reporting tool: replay, logs, selector";
const description =
  "Website bug reporting tool: the client clicks once, and the page URL, CSS selector, console logs and a replay arrive with the report. Free plan.";
const datePublished = "2026-11-14T00:00:00.000Z";
const dateModified = "2026-11-14T00:00:00.000Z";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: [
    "website bug reporting tool",
    "bug reporting tool",
    "bug reporting tool with console logs",
    "bug reporting tool with session replay",
    "bug reporting tool for clients",
  ],
  alternates: {
    canonical: pageUrl,
  },
  ...buildSocialMetadata({
    path: "/features/actionable-bug-reports",
    title,
    description,
  }),
};

export default function Page() {
  return (
    <div>
      <ActionableBugReportsHero />
      <ActionableBugReportsIntro />
      <ActionableBugReportsCapturedContext />
      <ActionableBugReportsRecording />
      <ActionableBugReportsDestinations />
      <TestimonialsSection />
      <ActionableBugReportsFaq />
      <ActionableBugReportsCta />

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
          { name: "Features", url: `${APP_URL}/features` },
          { name: "Actionable bug reports", url: pageUrl },
        ]}
      />
      <FaqSchema faqs={actionableBugReportsFaqs} />
    </div>
  );
}
