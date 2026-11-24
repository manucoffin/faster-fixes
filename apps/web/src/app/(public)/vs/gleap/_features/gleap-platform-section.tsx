import type { Route } from "next";
import { COMPETITOR_PRICES } from "@/app/(public)/_helpers/competitor-prices";
import { formatAmount } from "@/app/(public)/_helpers/format-competitor-price";
import { type VsPoint, VsPointGrid } from "../../_features/vs-point-grid";
import { VsSection } from "../../_features/vs-section";

const { aiConversation } = COMPETITOR_PRICES.gleap.otherPrices;

const points: VsPoint[] = [
  {
    title: "Kai, the AI agent",
    body: `Kai answers customers from your help center and website, at about ${formatAmount(aiConversation.amount, aiConversation.currency)} per conversation from a prepaid balance. Kai Code, on Growth and up, turns a confirmed bug into a pull request on GitHub, GitLab, Bitbucket or Azure DevOps. FasterFixes has no hosted agent: it hands each Feedback to the one you already run.`,
    link: { href: "/docs/mcp/setup" as Route, label: "MCP setup" },
  },
  {
    title: "Live chat, ticketing and a help center",
    body: "Every plan includes live chat and a shared inbox, and bug reports land there as tickets. Gleap's MCP server, on Growth and up, reads and updates those tickets. If support is what you use Gleap for, the alternatives are support platforms such as Intercom, Zendesk or Crisp, not the tools on this page.",
  },
  {
    title: "Mobile SDKs",
    body: "Gleap ships SDKs for iOS, Android, React Native, Flutter and Ionic, so one tool covers the website and the app. FasterFixes is web only: a script tag, plus packages for React, Vue, Angular and Svelte.",
    link: {
      href: "/docs/widget/overview" as Route,
      label: "Widget setup guide",
    },
  },
];

export function GleapPlatformSection() {
  return (
    <VsSection
      eyebrow="Gleap today"
      title="What Gleap has become: Kai, ticketing and mobile SDKs"
      intro="Gleap started as a bug reporting widget and now sells itself as an AI customer support platform. Bug reports are one channel of a support inbox, which is why many teams that only report bugs start looking for an alternative."
      tone="muted"
    >
      <VsPointGrid points={points} columns={1} />
    </VsSection>
  );
}
