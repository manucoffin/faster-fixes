import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { COMPETITOR_PRICES } from "@/app/(public)/_helpers/competitor-prices";
import {
  formatAmount,
  formatPrice,
} from "@/app/(public)/_helpers/format-competitor-price";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { VsFaqAnswer, type VsFaqItem } from "../../_features/vs-faq-section";

const freePlan = PLAN_LIMITS[SubscriptionPlanName.Free];
const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];

const { starter, team } = COMPETITOR_PRICES.markerIo.plans;
const { extraSeat, extraSeatBilledYearly } =
  COMPETITOR_PRICES.markerIo.otherPrices;

const starterAnnual = formatAmount(
  starter.billedYearlyAmount,
  starter.currency,
);
const teamAnnual = formatAmount(team.billedYearlyAmount, team.currency);
const freePlanSummary = `${freePlan.projects} project, up to ${freePlan.feedbacks} feedback items, ${freePlan.seats} team member`;

type DocLinkProps = {
  href: Route;
  children: ReactNode;
};

function DocLink({ href, children }: DocLinkProps) {
  return <Link href={href}>{children}</Link>;
}

export const markerIoFaqs: VsFaqItem[] = [
  {
    question: "Is there a free, open-source alternative to Marker.io?",
    answer: `Yes. FasterFixes is open source: the dashboard under AGPL-3.0 and the widget packages under MIT. Self-host it for free, or use the hosted Free plan (${freePlanSummary}).`,
    content: (
      <VsFaqAnswer>
        Yes. FasterFixes is open source: the dashboard under AGPL-3.0 and the
        widget packages under MIT. Self-host it for free, or use the hosted Free
        plan ({freePlanSummary}).
      </VsFaqAnswer>
    ),
  },
  {
    question: "How much does Marker.io cost for a team of five?",
    answer: `Marker.io ${starter.name} is ${formatPrice(starter)}/month for ${starter.seats} seats, or ${starterAnnual}/month billed yearly, and extra seats cost ${formatPrice(extraSeat)}/month (${formatPrice(extraSeatBilledYearly)} billed yearly). Jira sync, session replay and console logs need ${team.name}: ${formatPrice(team)}/month for ${team.seats} seats, or ${teamAnnual}/month billed yearly. FasterFixes is $0 self-hosted, or $${proPrice}/month hosted for up to ${proPlan.seats} members.`,
  },
  {
    question: "Does Marker.io have a free plan?",
    answer: `No. Marker.io offers a 15-day trial, then paid plans from ${starterAnnual}/month billed yearly. FasterFixes is free to self-host and has a permanent hosted Free plan (${freePlanSummary}).`,
  },
  {
    question: "Can I self-host FasterFixes?",
    answer:
      "Yes. The stack is Next.js, Postgres, Inngest, and R2 or S3-compatible storage. Deploy on your own infrastructure and run it without a FasterFixes hosted account. Marker.io has no self-hosted option.",
    content: (
      <VsFaqAnswer>
        Yes. The stack is Next.js, Postgres, Inngest, and R2 or S3-compatible
        storage. Deploy on your own infrastructure and run it without a
        FasterFixes hosted account. Marker.io has no self-hosted option. Full
        instructions in the{" "}
        <DocLink href={"/docs/self-hosting" as Route}>
          self-hosting guide
        </DocLink>
        .
      </VsFaqAnswer>
    ),
  },
  {
    question: "What does the MCP integration do?",
    answer:
      "@fasterfixes/mcp exposes your open feedback to Claude Code, Cursor, Codex, or any MCP-compatible agent, with the model you choose. The agent lists unresolved feedback, reads its technical context (URL, DOM selector, React component path, browser, viewport), applies a fix, and marks the item resolved. Marker.io's AI features stay inside its dashboard.",
    content: (
      <VsFaqAnswer>
        @fasterfixes/mcp exposes your open feedback to Claude Code, Cursor,
        Codex, or any MCP-compatible agent, with the model you choose. The agent
        lists unresolved feedback, reads its technical context (URL, DOM
        selector, React component path, browser, viewport), applies a fix, and
        marks the item resolved. Marker.io&apos;s AI features stay inside its
        dashboard. See{" "}
        <DocLink href={"/docs/mcp/setup" as Route}>MCP setup</DocLink>.
      </VsFaqAnswer>
    ),
  },
  {
    question: "Does FasterFixes need a browser extension?",
    answer:
      "No. Reviewers use the widget on the site itself: a script tag on any stack, or a package for React, Vue, Angular and Svelte. The widget does need to be installed on the site. If reviewers must comment on sites you cannot edit, Marker.io's browser extension is a better fit.",
    content: (
      <VsFaqAnswer>
        No. Reviewers use the widget on the site itself: a script tag on any
        stack, or a package for React, Vue, Angular and Svelte. The widget does
        need to be installed on the site. If reviewers must comment on sites you
        cannot edit, Marker.io&apos;s browser extension is a better fit. See the{" "}
        <DocLink href={"/docs/widget/install/script-embed" as Route}>
          script embed docs
        </DocLink>
        .
      </VsFaqAnswer>
    ),
  },
  {
    question: "How do I move my Marker.io data over?",
    answer:
      "Marker.io exports feedback as CSV. Hand the export to your AI agent: the @fasterfixes/mcp create_feedbacks tool bulk-imports the items into FasterFixes, preserving original timestamps and attributing them to a named reviewer.",
  },
  {
    question:
      "Does FasterFixes integrate with GitHub, Linear, Jira, and Trello like Marker.io does?",
    answer: `Yes. Each feedback item becomes a GitHub issue, Linear issue, Jira issue, or Trello card with the screenshot, component path, selector, and environment. Status syncs both ways, and a feedback can be linked to all four at once. Marker.io reserves Jira for ${team.name} at ${teamAnnual}/month billed yearly, and also covers Asana, ClickUp and Monday.com.`,
    content: (
      <VsFaqAnswer>
        Yes. Each feedback item becomes a GitHub issue, Linear issue, Jira
        issue, or Trello card with the screenshot, component path, selector, and
        environment. Status syncs both ways, and a feedback can be linked to all
        four at once. Marker.io reserves Jira for {team.name} at {teamAnnual}
        /month billed yearly, and also covers Asana, ClickUp and Monday.com. See
        the{" "}
        <DocLink href={"/docs/integrations/github" as Route}>
          integration docs
        </DocLink>
        .
      </VsFaqAnswer>
    ),
  },
];
