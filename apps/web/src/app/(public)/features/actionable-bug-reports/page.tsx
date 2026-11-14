import { APP_URL } from "@/app/_constants/app";
import { BreadcrumbSchema } from "@/app/_components/seo/breadcrumb-schema";
import { FaqSchema } from "@/app/_components/seo/faq-schema";
import { SoftwareApplicationSchema } from "@/app/(public)/_components/seo/software-application-schema";
import { WebPageSchema } from "@/app/_components/seo/web-page-schema";
import type { Metadata } from "next";
import { ActionableBugReportsCapturedContext } from "./_features/actionable-bug-reports-captured-context";
import { ActionableBugReportsCreation } from "./_features/actionable-bug-reports-creation";
import { ActionableBugReportsCta } from "./_features/actionable-bug-reports-cta";
import { ActionableBugReportsDestinations } from "./_features/actionable-bug-reports-destinations";
import {
  ActionableBugReportsFaq,
  actionableBugReportsFaqs,
} from "./_features/actionable-bug-reports-faq";
import { ActionableBugReportsHero } from "./_features/actionable-bug-reports-hero";
import { ActionableBugReportsInstall } from "./_features/actionable-bug-reports-install";
import { ActionableBugReportsIntro } from "./_features/actionable-bug-reports-intro";
import { ActionableBugReportsPricing } from "./_features/actionable-bug-reports-pricing";
import { ActionableBugReportsRecording } from "./_features/actionable-bug-reports-recording";

const pageUrl = `${APP_URL}/features/actionable-bug-reports`;
// Without the site name suffix: with it, the title overflows the search result width.
const title = "Website bug reporting tool with console logs and replay";
const description =
  "Website bug reporting tool for client projects: every report carries the page URL, selector, console logs, network requests and a replay. Free plan.";
const datePublished = "2026-11-14T00:00:00.000Z";
const dateModified = "2026-11-14T00:00:00.000Z";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title,
    description,
    url: pageUrl,
    type: "website",
  },
  twitter: {
    title,
    description,
  },
};

export default function Page() {
  return (
    <div>
      <ActionableBugReportsHero />
      <ActionableBugReportsIntro />
      <ActionableBugReportsCreation />
      <ActionableBugReportsCapturedContext />
      <ActionableBugReportsRecording />
      <ActionableBugReportsDestinations />
      <ActionableBugReportsInstall />
      <ActionableBugReportsPricing />
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
