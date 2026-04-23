import { SITE_META_DESCRIPTION, SITE_NAME } from "@/app/_constants/seo";
import {
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/server/auth/config/subscription-plans";
import { getAppUrl } from "@/utils/url/get-app-url";
import type { SoftwareApplication, WithContext } from "schema-dts";

export function SoftwareApplicationSchema() {
  const appUrl = getAppUrl();

  const jsonLd: WithContext<SoftwareApplication> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${appUrl}#software`,
    name: SITE_NAME,
    description: SITE_META_DESCRIPTION,
    url: appUrl,
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "Feedback widget",
    operatingSystem: "Web",
    inLanguage: "en-US",
    offers: [
      {
        "@type": "Offer",
        name: SubscriptionPlanName.Free,
        price: PLAN_PRICES[SubscriptionPlanName.Free],
        priceCurrency: "USD",
        url: `${appUrl}/pricing`,
      },
      {
        "@type": "Offer",
        name: SubscriptionPlanName.Pro,
        price: PLAN_PRICES[SubscriptionPlanName.Pro],
        priceCurrency: "USD",
        url: `${appUrl}/pricing`,
      },
      {
        "@type": "Offer",
        name: SubscriptionPlanName.Agency,
        price: PLAN_PRICES[SubscriptionPlanName.Agency],
        priceCurrency: "USD",
        url: `${appUrl}/pricing`,
      },
    ],
    publisher: {
      "@id": `${appUrl}#organization`,
    },
    featureList: [
      "Visual feedback widget for websites",
      "Automatic context capture (screenshot, URL, DOM selector, React component tree)",
      "Structured markdown bug reports for AI coding agents",
      "MCP server integration for Claude Code, Cursor, Windsurf",
      "GitHub issue sync",
      "Shareable client links with no account required",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
