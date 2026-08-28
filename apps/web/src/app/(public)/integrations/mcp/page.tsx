import { APP_URL } from "@/app/_constants/app";
import { SITE_NAME } from "@/app/_constants/seo";
import { BreadcrumbSchema } from "@/app/_features/seo/breadcrumb-schema";
import { FaqSchema } from "@/app/_features/seo/faq-schema";
import { HowToSchema } from "@/app/_features/seo/how-to-schema";
import { SoftwareApplicationSchema } from "@/app/_features/seo/software-application-schema";
import { WebPageSchema } from "@/app/_features/seo/web-page-schema";
import type { Metadata } from "next";
import { McpBreadcrumb } from "./_features/mcp-breadcrumb";
import { McpCtaSection } from "./_features/mcp-cta-section";
import { McpFaqSection, mcpFaqs } from "./_features/mcp-faq-section";
import { McpHero } from "./_features/mcp-hero";
import {
  McpHowItWorksSection,
  mcpSetupSteps,
} from "./_features/mcp-how-it-works-section";
import { McpMigrationSection } from "./_features/mcp-migration-section";
import { McpReproSection } from "./_features/mcp-repro-section";
import { McpSecuritySection } from "./_features/mcp-security-section";
import { McpToolsSection } from "./_features/mcp-tools-section";

const pageUrl = `${APP_URL}/integrations/mcp`;
// CTR here collapsed from 6.1% to 0.75% at roughly the same position. The old
// description ran 165 chars (truncated in the SERP) and described what the
// server is; this one names the tool call and the payload the agent receives.
const title = `MCP server: fix client feedback in Claude Code - ${SITE_NAME}`;
const description =
  "Your agent calls list_feedbacks and gets the screenshot, DOM selector, React tree, console logs and network requests — then fixes it from the terminal.";
const ogImageAlt =
  "FasterFixes MCP server — an AI coding agent fetching client feedback with a full repro bundle";
const datePublished = "2026-06-03T00:00:00.000Z";
const dateModified = "2026-06-03T00:00:00.000Z";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: [
    "feedback tool mcp",
    "website feedback mcp server",
    "client feedback mcp",
    "mcp server bug reports",
    "claude code feedback",
    "cursor feedback mcp",
    "ai coding agent feedback",
    "model context protocol feedback",
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
      <McpBreadcrumb />
      <McpHero />
      <McpReproSection />
      <McpToolsSection />
      <McpHowItWorksSection />
      <McpMigrationSection />
      <McpSecuritySection />
      <McpFaqSection />
      <McpCtaSection />

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
          { name: "Integrations", url: `${APP_URL}/integrations/mcp` },
          { name: "MCP server", url: pageUrl },
        ]}
      />
      <HowToSchema
        name="How to connect the Faster Fixes MCP server to your coding agent"
        description="Fetch, fix, and resolve client feedback from your editor in three steps."
        steps={mcpSetupSteps.map((step) => ({
          name: step.label,
          text: step.body,
        }))}
      />
      <FaqSchema faqs={mcpFaqs} />
    </div>
  );
}
