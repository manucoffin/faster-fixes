import { APP_URL } from "@/app/_constants/app";
import { BreadcrumbSchema } from "@/app/_components/seo/breadcrumb-schema";
import { FaqSchema } from "@/app/_components/seo/faq-schema";
import { HowToSchema } from "@/app/_components/seo/how-to-schema";
import { SoftwareApplicationSchema } from "@/app/(public)/_components/seo/software-application-schema";
import { WebPageSchema } from "@/app/_components/seo/web-page-schema";
import { buildSocialMetadata } from "@/app/(public)/_helpers/build-social-metadata";
import type { Metadata } from "next";
import { TrelloCardSection } from "./_features/trello-card-section";
import { TrelloCtaSection } from "./_features/trello-cta-section";
import { TrelloFaqSection, trelloFaqs } from "./_features/trello-faq-section";
import { TrelloHero } from "./_features/trello-hero";
import { TrelloIntro } from "./_features/trello-intro";
import {
  TrelloHowItWorksSection,
  trelloSetupSteps,
} from "./_features/trello-how-it-works-section";
import { TrelloSyncSection } from "./_features/trello-sync-section";

const pageUrl = `${APP_URL}/integrations/trello`;
// Targets the head term "trello integration": its SERP is automation platforms and a 2021 listicle,
// with no vendor page. Competitor pages never name what lands on the card, so the copy leads with the
// card contents and keeps two-way list sync as the second beat (ChatSEO 2026-11-16).
const title = "Trello integration: client feedback, synced both ways";
const description =
  "Trello integration for client feedback: page URL, CSS selector, console logs and a replay link on each card, screenshot as cover. Two-way list sync.";
const ogImageAlt =
  "Faster Fixes Trello integration: client feedback mirrored as a Trello card with the screenshot as its cover";
const datePublished = "2026-11-16T00:00:00.000Z";
const dateModified = "2026-11-16T00:00:00.000Z";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: [
    "trello integration",
    "trello bug tracking",
    "trello bug reporting",
    "trello issue tracking",
    "trello feedback",
    "client feedback trello",
    "trello bug tracking integration",
    "trello two-way sync",
  ],
  alternates: {
    canonical: pageUrl,
  },
  ...buildSocialMetadata({
    path: "/integrations/trello",
    title,
    description,
    imageAlt: ogImageAlt,
  }),
};

export default function Page() {
  return (
    <div>
      <TrelloHero />
      <TrelloIntro />
      <TrelloCardSection />
      <TrelloSyncSection />
      <TrelloHowItWorksSection />
      <TrelloFaqSection />
      <TrelloCtaSection />

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
          { name: "Integrations", url: `${APP_URL}/integrations/trello` },
          { name: "Trello", url: pageUrl },
        ]}
      />
      <HowToSchema
        name="How to connect Trello to Faster Fixes"
        description="Mirror client feedback as Trello cards in three steps."
        steps={trelloSetupSteps.map((step) => ({
          name: step.label,
          text: step.body,
        }))}
      />
      <FaqSchema faqs={trelloFaqs} />
    </div>
  );
}
