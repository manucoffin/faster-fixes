import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { COMPETITOR_PRICES } from "@/app/(public)/_helpers/competitor-prices";
import {
  formatAmount,
  formatPublishedPrice,
} from "@/app/(public)/_helpers/format-competitor-price";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { VsFaqAnswer, type VsFaqItem } from "../../_features/vs-faq-section";

const freePlan = PLAN_LIMITS[SubscriptionPlanName.Free];
const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];

const { standard, studio, premium } = COMPETITOR_PRICES.bugherd.plans;
const { extraSeat } = COMPETITOR_PRICES.bugherd.otherPrices;

const standardMonthly = formatPublishedPrice(standard, "/month");
const standardYearly = formatAmount(
  standard.billedYearlyAmount,
  standard.currency,
);
const extraSeatMonthly = formatPublishedPrice(extraSeat, "/month");
const studioMonthly = formatPublishedPrice(studio, "/month");
const premiumMonthly = formatPublishedPrice(premium, "/month");
const freePlanSummary = `${freePlan.projects} project, up to ${freePlan.feedbacks} feedback items, ${freePlan.seats} team member`;

type DocLinkProps = {
  href: Route;
  children: ReactNode;
};

function DocLink({ href, children }: DocLinkProps) {
  return <Link href={href}>{children}</Link>;
}

export const bugherdFaqs: VsFaqItem[] = [
  {
    question: "Is there an open-source alternative to BugHerd?",
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
    question: "How much does BugHerd cost for a team of five?",
    answer: `BugHerd ${standard.name} covers ${standard.seats} members at ${standardMonthly}, or ${standardYearly}/month billed yearly. Each extra user adds ${extraSeatMonthly}. ${studio.name} covers ${studio.seats} members at ${studioMonthly} and ${premium.name} ${premium.seats} at ${premiumMonthly}. FasterFixes is $0 self-hosted, or $${proPrice}/month hosted for up to ${proPlan.seats} members.`,
  },
  {
    question: "Does BugHerd have a free plan?",
    answer: `No. BugHerd offers a 7-day trial, then paid plans from ${standardMonthly}. FasterFixes is free to self-host and has a permanent hosted Free plan (${freePlanSummary}).`,
  },
  {
    question: "Can I self-host FasterFixes?",
    answer:
      "Yes. The stack is Next.js, Postgres, Inngest, and R2 or S3-compatible storage. Deploy on your own infrastructure and run it without a FasterFixes hosted account.",
    content: (
      <VsFaqAnswer>
        Yes. The stack is Next.js, Postgres, Inngest, and R2 or S3-compatible
        storage. Deploy on your own infrastructure and run it without a
        FasterFixes hosted account. Full instructions in the{" "}
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
      "@fasterfixes/mcp exposes your open feedback to Claude Code, Cursor, Codex, or any MCP-compatible agent, with the model you choose. The agent lists unresolved feedback, reads its technical context (URL, DOM selector, React component path, browser, viewport), applies a fix, and marks the item resolved. BugHerd AI, by contrast, is bundled into the BugHerd dashboard.",
    content: (
      <VsFaqAnswer>
        @fasterfixes/mcp exposes your open feedback to Claude Code, Cursor,
        Codex, or any MCP-compatible agent, with the model you choose. The agent
        lists unresolved feedback, reads its technical context (URL, DOM
        selector, React component path, browser, viewport), applies a fix, and
        marks the item resolved. BugHerd AI, by contrast, is bundled into the
        BugHerd dashboard. See{" "}
        <DocLink href={"/docs/mcp/setup" as Route}>MCP setup</DocLink>.
      </VsFaqAnswer>
    ),
  },
  {
    question: "Does FasterFixes have a kanban board?",
    answer:
      "Yes. The team dashboard includes a drag-and-drop kanban view. What FasterFixes does not have today is a client-facing task board (BugHerd's Premium plan does). It is on the roadmap.",
  },
  {
    question: "How do I move my BugHerd data over?",
    answer:
      "BugHerd supports CSV, XML, and JSON exports from all plans. Hand the export to your AI agent: the @fasterfixes/mcp create_feedbacks tool bulk-imports the items into FasterFixes, preserving original timestamps and attributing them to a named reviewer.",
  },
  {
    question:
      "Does FasterFixes integrate with GitHub, Linear, Jira, and Trello like BugHerd does?",
    answer:
      "Yes. Each feedback item becomes a GitHub issue, Linear issue, Jira issue, or Trello card with the screenshot, component path, selector, and environment. Status syncs both ways: resolving it on one side resolves it on the other. A feedback can be linked to all four at once.",
    content: (
      <VsFaqAnswer>
        Yes. Each feedback item becomes a GitHub issue, Linear issue, Jira
        issue, or Trello card with the screenshot, component path, selector, and
        environment. Status syncs both ways: resolving it on one side resolves
        it on the other. A feedback can be linked to all four at once. See the{" "}
        <DocLink href={"/docs/integrations/github" as Route}>
          integration docs
        </DocLink>
        .
      </VsFaqAnswer>
    ),
  },
];
