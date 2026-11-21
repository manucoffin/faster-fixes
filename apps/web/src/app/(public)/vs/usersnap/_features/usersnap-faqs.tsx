import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { COMPETITOR_PRICES } from "@/app/(public)/_helpers/competitor-prices";
import {
  formatPrice,
  formatPublishedPrice,
} from "@/app/(public)/_helpers/format-competitor-price";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { VsFaqAnswer, type VsFaqItem } from "../../_features/vs-faq-section";

const freePlan = PLAN_LIMITS[SubscriptionPlanName.Free];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];

const { starter, growth } = COMPETITOR_PRICES.usersnap.plans;
const freeFeedbackLimit = PLAN_LIMITS[SubscriptionPlanName.Free].feedbacks;

type DocLinkProps = {
  href: Route;
  children: ReactNode;
};

function DocLink({ href, children }: DocLinkProps) {
  return <Link href={href}>{children}</Link>;
}

export const usersnapFaqs: VsFaqItem[] = [
  {
    question: "Does Usersnap have a free plan?",
    answer: `No. Usersnap offers a free trial, and a free month of Premium once you set up 2 channels and collect 20 pieces of feedback. The first paid tier is ${starter.name} at ${formatPrice(starter)} per month. FasterFixes has a permanent free plan, and self-hosting it costs $0.`,
  },
  {
    question: "How much does Usersnap cost for a five-person team?",
    answer: `${formatPublishedPrice(growth, " per month")} on Usersnap ${growth.name}, since ${starter.name} covers only ${starter.seats} seats. Billed yearly, ${growth.name} drops to ${formatPrice({ amount: growth.billedYearlyAmount, currency: growth.currency })} per month. The same team pays $${proPrice}/month on FasterFixes Pro, or $0 self-hosted.`,
  },
  {
    question: "How is FasterFixes different from Usersnap?",
    answer:
      "FasterFixes is open source and self-hostable; Usersnap is closed-source and cloud-only. FasterFixes is built for developers fixing bugs, with an MCP server your coding agent reads. Usersnap is a broader product feedback platform with surveys, public roadmaps and AI feedback analysis.",
  },
  {
    question: "Is FasterFixes free and open source?",
    answer: `Yes. The dashboard is AGPL-3.0 and the widget is MIT, so self-hosting is free for any team size. The hosted Free plan is permanent: ${freePlan.projects} project, ${freeFeedbackLimit} feedback items, ${freePlan.seats} member, no credit card. Paid hosted plans are $${proPrice}/month for Pro and $${agencyPrice}/month for Agency.`,
  },
  {
    question: "Can I self-host FasterFixes?",
    answer:
      "Yes, on Next.js, Postgres, Inngest, and R2 or S3-compatible storage. Usersnap has no self-hosted option.",
    content: (
      <VsFaqAnswer>
        Yes, on Next.js, Postgres, Inngest, and R2 or S3-compatible storage.
        Usersnap has no self-hosted option. See the{" "}
        <DocLink href={"/docs/self-hosting" as Route}>
          self-hosting guide
        </DocLink>
        .
      </VsFaqAnswer>
    ),
  },
  {
    question: "What does the FasterFixes MCP server do?",
    answer:
      "@fasterfixes/mcp lets a coding agent such as Claude Code, Cursor or Codex list open feedback, read its context (URL, DOM selector, React component path, console and network logs), fix the code and set the Status. Usersnap's MCP server targets product analysis: it searches feedback and manages opportunities, but cannot edit feedback.",
    content: (
      <VsFaqAnswer>
        @fasterfixes/mcp lets a coding agent such as Claude Code, Cursor or
        Codex list open feedback, read its context (URL, DOM selector, React
        component path, console and network logs), fix the code and set the
        Status. Usersnap&apos;s MCP server targets product analysis: it searches
        feedback and manages opportunities, but cannot edit feedback. See{" "}
        <DocLink href={"/docs/mcp/setup" as Route}>MCP setup</DocLink>.
      </VsFaqAnswer>
    ),
  },
  {
    question: "Does it work on React and other stacks?",
    answer:
      "Both tools do. Usersnap loads from a JavaScript snippet or its browser extension. FasterFixes installs with one script tag on any site, or with packages for React, Vue, Angular and Svelte, and on React sites it captures the component behind each Feedback. It has no browser extension, so the widget must be on the site.",
    content: (
      <VsFaqAnswer>
        Both tools do. Usersnap loads from a JavaScript snippet or its browser
        extension. FasterFixes installs with one{" "}
        <DocLink href={"/docs/widget/install/script-embed" as Route}>
          script tag
        </DocLink>{" "}
        on any site, or with packages for{" "}
        <DocLink href={"/docs/widget/install/react" as Route}>React</DocLink>,
        Vue, Angular and Svelte, and on React sites it captures the component
        behind each Feedback. It has no browser extension, so the widget must be
        on the site.
      </VsFaqAnswer>
    ),
  },
  {
    question: "Does FasterFixes support NPS surveys?",
    answer:
      "No. FasterFixes has no in-app surveys, public roadmap or idea voting. If those are central to your process, Usersnap is the better fit.",
  },
];
