import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { COMPETITOR_PRICES } from "../../../_helpers/competitor-prices";
import { formatPrice } from "../../../_helpers/format-competitor-price";
import { VsFaqAnswer, type VsFaqItem } from "../../_features/vs-faq-section";

const freePlan = PLAN_LIMITS[SubscriptionPlanName.Free];
const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];
const { team, business, businessPlus } = COMPETITOR_PRICES.userback.plans;
const { extraSeat } = COMPETITOR_PRICES.userback.otherPrices;

type DocLinkProps = {
  href: Route;
  children: ReactNode;
};

function DocLink({ href, children }: DocLinkProps) {
  return (
    <Link
      href={href}
      className="text-foreground underline underline-offset-4 hover:no-underline"
    >
      {children}
    </Link>
  );
}

export const userbackFaqs: VsFaqItem[] = [
  {
    question: "How much does Userback cost compared to FasterFixes?",
    answer: `On monthly billing, Userback ${team.name} is ${formatPrice(team)}/month for ${team.seats} seats, ${business.name} ${formatPrice(business)}/month for ${business.seats} seats, and ${businessPlus.name} ${formatPrice(businessPlus)}/month for ${businessPlus.seats} seats, with extra seats at ${formatPrice(extraSeat)}/month. FasterFixes is free to self-host, $${proPrice}/month hosted for ${proPlan.seats} members, and $${agencyPrice}/month for unlimited members.`,
  },
  {
    question: "Is FasterFixes free?",
    answer: `Yes. The free plan includes ${freePlan.projects} project, ${freePlan.feedbacks} feedback items, and ${freePlan.seats} member, with no credit card. The self-hosted version is also free under AGPL-3.0: you only pay for your own hosting, typically $5-20/month on Railway or Vercel.`,
  },
  {
    question: "Can I self-host FasterFixes?",
    answer:
      "Yes. The stack is Next.js, Postgres, Inngest, and R2 or S3-compatible storage, deployable on Vercel, Railway, or any Node host. Userback has no self-hosted option.",
    content: (
      <VsFaqAnswer>
        Yes. The stack is Next.js, Postgres, Inngest, and R2 or S3-compatible
        storage, deployable on Vercel, Railway, or any Node host. Userback has
        no self-hosted option. See the{" "}
        <DocLink href={"/docs/self-hosting" as Route}>
          self-hosting guide
        </DocLink>
        .
      </VsFaqAnswer>
    ),
  },
  {
    question: "Is FasterFixes open source?",
    answer:
      "Yes. The dashboard is licensed under AGPL-3.0 and the widget under MIT, with the source code public on GitHub. Userback is proprietary and closed-source.",
  },
  {
    question: "Does FasterFixes work on non-React stacks?",
    answer:
      "Yes. One script tag installs the widget on any site, with the same screenshot, DOM selector, console, and network capture as the React package. The React component path is added when the site runs React. Unlike Userback, FasterFixes has no browser extension.",
    content: (
      <VsFaqAnswer>
        Yes. One script tag installs the widget on any site, with the same
        screenshot, DOM selector, console, and network capture as the React
        package. The React component path is added when the site runs React.
        Unlike Userback, FasterFixes has no browser extension. See the{" "}
        <DocLink href={"/docs/widget/install/script-embed" as Route}>
          script embed docs
        </DocLink>
        .
      </VsFaqAnswer>
    ),
  },
  {
    question: "What does the MCP server do?",
    answer:
      "@fasterfixes/mcp connects Claude Code, Cursor, and Codex to your FasterFixes workspace, so your agent reads feedback in the terminal instead of a browser tab. Userback also offers an MCP server, but FasterFixes is open source and self-hostable end to end.",
    content: (
      <VsFaqAnswer>
        @fasterfixes/mcp connects Claude Code, Cursor, and Codex to your
        FasterFixes workspace, so your agent reads feedback in the terminal
        instead of a browser tab. Userback also offers an MCP server, but
        FasterFixes is open source and self-hostable end to end. See{" "}
        <DocLink href={"/docs/mcp/setup" as Route}>MCP setup</DocLink>.
      </VsFaqAnswer>
    ),
  },
  {
    question: "How do I migrate from Userback?",
    answer:
      "Export your feedback as CSV from Userback (Settings > Export), swap the Userback script for the FasterFixes widget, then connect GitHub, Linear, or Jira on a paid plan. Screen recordings, session replays, and survey responses do not migrate. The three steps are detailed in the migration section above.",
  },
];
