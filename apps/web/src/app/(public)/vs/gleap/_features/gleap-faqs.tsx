import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { COMPETITOR_PRICES } from "@/app/(public)/_helpers/competitor-prices";
import { formatAmount } from "@/app/(public)/_helpers/format-competitor-price";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { VsFaqAnswer, type VsFaqItem } from "../../_features/vs-faq-section";

const freePlan = PLAN_LIMITS[SubscriptionPlanName.Free];
const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];

const { plans, otherPrices } = COMPETITOR_PRICES.gleap;
const { hobby, growth, pro, enterprise } = plans;
const usd = (amount: number) => formatAmount(amount, "USD");

type DocLinkProps = {
  href: Route;
  children: ReactNode;
};

function DocLink({ href, children }: DocLinkProps) {
  return <Link href={href}>{children}</Link>;
}

const costAnswer = `Billed yearly, ${hobby.name} is ${usd(hobby.billedYearlyAmount)}/mo for ${hobby.seats} seat and ${hobby.projects} project, ${growth.name} is ${usd(growth.billedYearlyAmount)}/mo for ${growth.seats} seats, ${pro.name} is ${usd(pro.billedYearlyAmount)}/mo with unlimited seats, and ${enterprise.name} starts at ${usd(enterprise.billedYearlyAmount)}/mo. Monthly billing costs about 20% more, and Kai is billed on top from a prepaid balance.`;
const gleapFreeAnswer = `No. Gleap offers a 7-day trial with no credit card, then ${hobby.name} at ${usd(hobby.amount)}/mo, or ${usd(hobby.billedYearlyAmount)}/mo billed yearly, is the smallest plan.`;
const bestAnswer = `For bug reporting on websites, FasterFixes: it is the only Gleap alternative you can self-host for $0, and hosted Pro is $${proPrice}/mo flat for up to ${proPlan.seats} members. If you need live chat or mobile SDKs, Gleap remains the better fit.`;
const freeAnswer = `Yes. The free plan covers ${freePlan.projects} project, ${freePlan.feedbacks} Feedback items and ${freePlan.seats} member, and self-hosting costs $0 with no member limit.`;
const selfHostAnswer =
  "Yes, on Next.js, Postgres, Inngest and R2 or S3, with the dashboard under AGPL-3.0 and the widget under MIT. Gleap is cloud-only: its SDKs are open source, the platform is not.";
const mcpAnswer = `Yes. Gleap's MCP server, on ${growth.name} and up, lets Claude or Cursor read and update support tickets. @fasterfixes/mcp is on every plan, self-hosted included, and gives Claude Code, Cursor and Codex one Feedback at a time with its DOM selector, console logs and network requests.`;
const mobileAnswer =
  "No. FasterFixes is web only: a script tag for any website, plus packages for React, Vue, Angular and Svelte. Gleap covers iOS, Android, React Native and Flutter.";
const supportAnswer =
  "No. There is no chatbot, no ticketing and no shared inbox. FasterFixes is a bug reporting tool, not a support platform.";

export const gleapFaqs: VsFaqItem[] = [
  {
    question: "How much does Gleap cost?",
    answer: costAnswer,
    content: (
      <VsFaqAnswer>
        {costAnswer} Extra {growth.name} seats are{" "}
        {usd(otherPrices.extraSeat.amount)}/mo each.
      </VsFaqAnswer>
    ),
  },
  {
    question: "Does Gleap have a free plan?",
    answer: gleapFreeAnswer,
  },
  {
    question: "What is the best Gleap alternative?",
    answer: bestAnswer,
  },
  {
    question: "Is FasterFixes a free Gleap alternative?",
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
    question: "Does Gleap have an MCP server?",
    answer: mcpAnswer,
    content: (
      <VsFaqAnswer>
        {mcpAnswer} See{" "}
        <DocLink href={"/docs/mcp/setup" as Route}>MCP setup</DocLink>.
      </VsFaqAnswer>
    ),
  },
  {
    question: "Does FasterFixes have mobile SDKs?",
    answer: mobileAnswer,
  },
  {
    question: "Does FasterFixes support live chat or customer support?",
    answer: supportAnswer,
  },
];
