import { APP_URL } from "@/app/_constants/app";
import { BreadcrumbSchema } from "@/app/_components/seo/breadcrumb-schema";
import { FaqSchema } from "@/app/_components/seo/faq-schema";
import { SoftwareApplicationSchema } from "@/app/(public)/_components/seo/software-application-schema";
import { WebPageSchema } from "@/app/_components/seo/web-page-schema";
import { TestimonialsSection } from "@/app/_domains/testimonial/testimonials-section/testimonials-section";
import type { Metadata } from "next";
import { WebsiteAnnotationCta } from "./_features/website-annotation-cta";
import {
  WebsiteAnnotationFaq,
  websiteAnnotationFaqs,
} from "./_features/website-annotation-faq";
import { WebsiteAnnotationHero } from "./_features/website-annotation-hero";
import { WebsiteAnnotationHowItWorks } from "./_features/website-annotation-how-it-works";
import { WebsiteAnnotationIntro } from "./_features/website-annotation-intro";
import { WebsiteAnnotationMasking } from "./_features/website-annotation-masking";
import { WebsiteAnnotationMcp } from "./_features/website-annotation-mcp";
import { WebsiteAnnotationOpenSource } from "./_features/website-annotation-open-source";

const pageUrl = `${APP_URL}/features/website-annotation`;
// Without the site name suffix: with it, the title overflows the search result width.
const title = "Website annotation tool: client clicks become agent-ready tasks";
const description =
  "Website annotation tool for client reviews: one click, one sentence, and a report with selector, console log and a one-minute replay. Free plan.";
const datePublished = "2026-11-12T00:00:00.000Z";
const dateModified = "2026-11-13T00:00:00.000Z";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: [
    "website annotation tool",
    "website annotation",
    "annotate website",
    "web annotation tool",
    "website feedback tool",
    "feedback tool for websites",
    "open source website feedback tool",
  ],
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
      <WebsiteAnnotationHero />
      <WebsiteAnnotationIntro />
      <WebsiteAnnotationHowItWorks />
      <WebsiteAnnotationMasking />
      <WebsiteAnnotationOpenSource />
      <WebsiteAnnotationMcp />
      <TestimonialsSection />
      <WebsiteAnnotationFaq />
      <WebsiteAnnotationCta />

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
          { name: "Website annotation", url: pageUrl },
        ]}
      />
      <FaqSchema faqs={websiteAnnotationFaqs} />
    </div>
  );
}
