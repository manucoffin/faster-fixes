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
const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];

const { pro } = COMPETITOR_PRICES.atarim.plans;
const atarimProMonthly = formatPrice(pro);
const atarimProYearly = formatAmount(pro.billedYearlyAmount, pro.currency);

type DocLinkProps = {
  href: Route;
  children: ReactNode;
};

function DocLink({ href, children }: DocLinkProps) {
  return <Link href={href}>{children}</Link>;
}

const freeAnswer = `Yes. The free plan covers ${freePlan.projects} project, ${freePlan.feedbacks} Feedback items and ${freePlan.seats} member, and self-hosting costs $0.`;
const selfHostAnswer =
  "Yes, on Next.js, Postgres, Inngest and R2 or S3, with the dashboard under AGPL-3.0 and the widget under MIT. Atarim is cloud-only, with no self-hosted build.";
const wordpressAnswer =
  "Yes, Atarim ships a dedicated WordPress plugin and a Chrome extension, and FasterFixes ships neither. FasterFixes installs on WordPress with one script tag.";
const mcpAnswer =
  "@fasterfixes/mcp lets Claude Code, Cursor and Codex read a Feedback, propose the fix and set the Status. Atarim's free MCP reaches tasks, sites and workflows rather than the code behind a report.";
const stacksAnswer =
  "Yes. Packages cover React, Vue, Angular and Svelte, and the script tag covers everything else.";
const trackersAnswer =
  "GitHub, Linear, Jira and Trello, two-way, plus Slack notifications. Atarim lists more, including Asana, ClickUp, Basecamp and Monday.com.";
const seatsAnswer = `Pro covers ${proPlan.seats} members and ${proPlan.projects} projects, so a sixth member or project moves you to Agency at $${agencyPrice}/mo. Atarim ${pro.name}, at ${atarimProMonthly}/mo or ${atarimProYearly}/mo billed yearly, is then the cheaper hosted bill.`;
const openSourceAnswer =
  "Yes, the dashboard is AGPL-3.0 and the widget MIT, with the source on GitHub. Atarim is proprietary, with no public source.";

export const atarimFaqs: VsFaqItem[] = [
  {
    question: "Is FasterFixes a free Atarim alternative?",
    answer: freeAnswer,
    content: (
      <VsFaqAnswer>
        {freeAnswer} See <DocLink href={"/pricing" as Route}>pricing</DocLink>.
      </VsFaqAnswer>
    ),
  },
  {
    question: "Can I self-host FasterFixes?",
    answer: selfHostAnswer,
    content: (
      <VsFaqAnswer>
        {selfHostAnswer} See the{" "}
        <DocLink href={"/docs/self-hosting" as Route}>
          self-hosting guide
        </DocLink>
        .
      </VsFaqAnswer>
    ),
  },
  {
    question: "Does Atarim have a WordPress plugin?",
    answer: wordpressAnswer,
    content: (
      <VsFaqAnswer>
        {wordpressAnswer} See the{" "}
        <DocLink href={"/docs/widget/install/script-embed" as Route}>
          script embed guide
        </DocLink>
        .
      </VsFaqAnswer>
    ),
  },
  {
    question: "What does the MCP server do?",
    answer: mcpAnswer,
    content: (
      <VsFaqAnswer>
        {mcpAnswer} See{" "}
        <DocLink href={"/docs/mcp/setup" as Route}>MCP setup</DocLink>.
      </VsFaqAnswer>
    ),
  },
  {
    question: "Does FasterFixes work on Vue, Angular and Svelte?",
    answer: stacksAnswer,
    content: (
      <VsFaqAnswer>
        Yes. Packages cover{" "}
        <DocLink href={"/docs/widget/install/react" as Route}>React</DocLink>,{" "}
        <DocLink href={"/docs/widget/install/vue" as Route}>Vue</DocLink>,{" "}
        <DocLink href={"/docs/widget/install/angular" as Route}>
          Angular
        </DocLink>{" "}
        and{" "}
        <DocLink href={"/docs/widget/install/svelte" as Route}>Svelte</DocLink>,
        and the{" "}
        <DocLink href={"/docs/widget/install/script-embed" as Route}>
          script tag
        </DocLink>{" "}
        covers everything else.
      </VsFaqAnswer>
    ),
  },
  {
    question: "Which trackers does FasterFixes sync with?",
    answer: trackersAnswer,
    content: (
      <VsFaqAnswer>
        <DocLink href={"/integrations/github" as Route}>GitHub</DocLink>,{" "}
        <DocLink href={"/integrations/linear" as Route}>Linear</DocLink>,{" "}
        <DocLink href={"/integrations/jira" as Route}>Jira</DocLink> and{" "}
        <DocLink href={"/integrations/trello" as Route}>Trello</DocLink>,
        two-way, plus{" "}
        <DocLink href={"/integrations/slack" as Route}>
          Slack notifications
        </DocLink>
        . Atarim lists more, including Asana, ClickUp, Basecamp and Monday.com.
      </VsFaqAnswer>
    ),
  },
  {
    question: `What happens past ${proPlan.seats} members?`,
    answer: seatsAnswer,
    content: (
      <VsFaqAnswer>
        {seatsAnswer} See <DocLink href={"/pricing" as Route}>pricing</DocLink>.
      </VsFaqAnswer>
    ),
  },
  {
    question: "Is FasterFixes open source?",
    answer: openSourceAnswer,
    content: (
      <VsFaqAnswer>
        {openSourceAnswer} See{" "}
        <DocLink href={"/open-source" as Route}>open source</DocLink>.
      </VsFaqAnswer>
    ),
  },
];
