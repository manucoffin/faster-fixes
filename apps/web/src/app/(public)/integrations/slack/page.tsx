import { APP_URL } from "@/app/_constants/app";
import { SITE_NAME } from "@/app/_constants/seo";
import { BreadcrumbSchema } from "@/app/_components/seo/breadcrumb-schema";
import { FaqSchema } from "@/app/_components/seo/faq-schema";
import { HowToSchema } from "@/app/_components/seo/how-to-schema";
import { SoftwareApplicationSchema } from "@/app/(public)/_components/seo/software-application-schema";
import { WebPageSchema } from "@/app/_components/seo/web-page-schema";
import type { Metadata } from "next";
import { SlackBreadcrumb } from "./_features/slack-breadcrumb";
import { SlackCtaSection } from "./_features/slack-cta-section";
import { SlackFaqSection, slackFaqs } from "./_features/slack-faq-section";
import { SlackHero } from "./_features/slack-hero";
import {
  SlackHowItWorksSection,
  slackSetupSteps,
} from "./_features/slack-how-it-works-section";
import { SlackMessageSection } from "./_features/slack-message-section";
import { SlackUpdatesSection } from "./_features/slack-updates-section";

const pageUrl = `${APP_URL}/integrations/slack`;
const title = `Slack notifications for website feedback | ${SITE_NAME}`;
const description =
  "Get notified in Slack when a client submits or updates feedback on your staging site — with screenshot, page URL, and status. No noise.";
const ogImageAlt =
  "FasterFixes Slack integration — client feedback posted to a Slack channel with screenshot and status badge";
const datePublished = "2026-05-31T00:00:00.000Z";
const dateModified = "2026-05-31T00:00:00.000Z";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: [
    "website feedback slack integration",
    "slack bug reporting",
    "feedback notifications slack",
    "visual feedback slack",
    "client feedback slack channel",
    "staging site feedback notifications",
    "feedback widget slack",
    "website feedback tool slack",
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
      <SlackBreadcrumb />
      <SlackHero />
      <SlackMessageSection />
      <SlackUpdatesSection />
      <SlackHowItWorksSection />
      <SlackFaqSection />
      <SlackCtaSection />

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
          { name: "Integrations", url: `${APP_URL}/integrations/slack` },
          { name: "Slack", url: pageUrl },
        ]}
      />
      <HowToSchema
        name="How to connect Slack to Faster Fixes"
        description="Post client feedback into a Slack channel in three steps."
        steps={slackSetupSteps.map((step) => ({
          name: step.label,
          text: step.body,
        }))}
      />
      <FaqSchema faqs={slackFaqs} />
    </div>
  );
}
