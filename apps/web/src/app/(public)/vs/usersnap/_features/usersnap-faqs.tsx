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

const { starter, growth, professional, premium } =
  COMPETITOR_PRICES.usersnap.plans;
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
    question: "Is FasterFixes free to use?",
    answer: `Yes. The hosted Free plan is permanent: ${freePlan.projects} project, ${freeFeedbackLimit} feedback items, ${freePlan.seats} member, no time limit, no credit card. The dashboard is open source under AGPL-3.0 and the widget is MIT, so self-hosting is also free regardless of team size. Paid hosted plans are $${proPrice}/month for Pro and $${agencyPrice}/month for Agency.`,
    content: (
      <VsFaqAnswer>
        Yes. The hosted Free plan is permanent: {freePlan.projects} project,{" "}
        {freeFeedbackLimit} feedback items, {freePlan.seats} member, no time
        limit, no credit card. The dashboard is open source under AGPL-3.0 and
        the widget is MIT, so{" "}
        <DocLink href={"/docs/self-hosting" as Route}>self-hosting</DocLink> is
        also free regardless of team size. Paid hosted plans are ${proPrice}
        /month for Pro and ${agencyPrice}/month for Agency.
      </VsFaqAnswer>
    ),
  },
  {
    question: "Can I self-host FasterFixes?",
    answer:
      "Yes. The stack is Next.js, Postgres, Inngest, and R2 or S3-compatible storage. Usersnap has no self-hosted option. Deploy on your own infrastructure and run FasterFixes without a hosted account. The dashboard is AGPL-3.0; the widget packages are MIT.",
    content: (
      <VsFaqAnswer>
        Yes. The stack is Next.js, Postgres, Inngest, and R2 or S3-compatible
        storage. Usersnap has no self-hosted option. Deploy on your own
        infrastructure and run FasterFixes without a hosted account. The
        dashboard is AGPL-3.0; the widget packages are MIT. Full instructions in
        the{" "}
        <DocLink href={"/docs/self-hosting" as Route}>
          self-hosting guide
        </DocLink>
        .
      </VsFaqAnswer>
    ),
  },
  {
    question: "How is FasterFixes different from Usersnap?",
    answer:
      "FasterFixes is open-source and self-hostable; Usersnap is closed-source and cloud-only. FasterFixes ships an MCP server so AI coding agents (Claude Code, Cursor, Codex) can fetch and resolve feedback from the terminal. Usersnap is a broader platform focused on in-app surveys, public roadmaps, and AI feedback analysis. FasterFixes does not currently offer those features. FasterFixes is built specifically for developer teams who need structured bug reports, not product feedback surveys.",
    content: (
      <VsFaqAnswer>
        FasterFixes is open-source and self-hostable; Usersnap is closed-source
        and cloud-only. FasterFixes ships an{" "}
        <DocLink href={"/docs/mcp/setup" as Route}>MCP server</DocLink> so AI
        coding agents (Claude Code, Cursor, Codex) can fetch and resolve
        feedback from the terminal. Usersnap is a broader platform focused on
        in-app surveys, public roadmaps, and AI feedback analysis. FasterFixes
        does not currently offer those features.
      </VsFaqAnswer>
    ),
  },
  {
    question: "Does FasterFixes support NPS surveys?",
    answer:
      "No. FasterFixes does not currently support NPS or other in-app surveys, public roadmaps, or idea voting. If those workflows are central to your process, Usersnap is the better fit. FasterFixes is focused on visual bug reports and structured feedback for developer teams.",
  },
  {
    question: "What does the MCP integration do?",
    answer:
      "@fasterfixes/mcp exposes your open feedback to any MCP-compatible coding agent. Your agent can list unresolved feedback, read the full technical context (URL, DOM selector, React component path when available, browser, viewport), apply a fix, and mark the item resolved, all from the terminal. Usersnap's MCP server targets product analysis instead: it searches feedback, browses topics, and creates and updates opportunities, but cannot edit existing feedback.",
    content: (
      <VsFaqAnswer>
        @fasterfixes/mcp exposes your open feedback to any MCP-compatible coding
        agent. Your agent can list unresolved feedback, read the full technical
        context (URL, DOM selector, React component path when available,
        browser, viewport), apply a fix, and mark the item resolved, all from
        the terminal. Usersnap&apos;s MCP server targets product analysis
        instead: it searches feedback, browses topics, and creates and updates
        opportunities, but cannot edit existing feedback. See{" "}
        <DocLink href={"/docs/mcp/setup" as Route}>MCP setup</DocLink> and the{" "}
        <DocLink href={"/docs/mcp/tools" as Route}>tool reference</DocLink>.
      </VsFaqAnswer>
    ),
  },
  {
    question: "How much does Usersnap cost for a five-person team?",
    answer: `${formatPublishedPrice(growth, " per month")} on Usersnap ${growth.name}. ${starter.name}, at ${formatPrice(starter)} per month, covers only ${starter.seats} seats and ${starter.projects} projects, and every higher tier has unlimited seats and is sized by projects: ${growth.name} covers ${growth.projects}, ${professional.name} ${professional.projects} at ${formatPrice(professional)}, ${premium.name} ${premium.projects} at ${formatPrice(premium)}. Usersnap lists its prices in EUR, and yearly billing saves up to ${COMPETITOR_PRICES.usersnap.yearlySavesUpToMonths} months. FasterFixes is $0 self-hosted, $${proPrice}/month for Pro and $${agencyPrice}/month for Agency.`,
  },
  {
    question: "Does Usersnap have a free plan?",
    answer: `No. Usersnap offers a free trial, and unlocks a free month of Premium once you set up 2 channels and collect your first 20 pieces of feedback. The first paid tier is ${starter.name} at ${formatPrice(starter)} per month. FasterFixes has a permanent free plan with ${freePlan.projects} project and ${freeFeedbackLimit} feedback items, and self-hosting it costs $0.`,
  },
  {
    question: "Does it work on a React site?",
    answer:
      "Both do. Usersnap loads from a JavaScript snippet on any stack, React included, or through its browser extension. FasterFixes ships a script tag plus packages for React, Vue, Angular and Svelte, and on React sites it captures the component tree behind each Feedback.",
    content: (
      <VsFaqAnswer>
        Both do. Usersnap loads from a JavaScript snippet on any stack, React
        included, or through its browser extension. FasterFixes ships a script
        tag plus packages for React, Vue, Angular and Svelte, and on React sites
        it captures the component tree behind each Feedback. See the{" "}
        <DocLink href={"/docs/widget/install/react" as Route}>
          React embed docs
        </DocLink>
        .
      </VsFaqAnswer>
    ),
  },
  {
    question: "How do I install the widget on my site?",
    answer:
      'On any site, paste one script tag with your Project ID, or run npm install @fasterfixes/widget and call init({ projectId }). In a React or Next.js app, you can instead run npm install @fasterfixes/react and wrap your app in <FeedbackProvider projectId="proj_...">. Both embeds share the same widget, options, and captured context. On React sites, every report also carries the component path.',
    content: (
      <VsFaqAnswer>
        On any site, paste one script tag with your Project ID, or run npm
        install @fasterfixes/widget and call init({"{ projectId }"}). In a React
        or Next.js app, you can instead run npm install @fasterfixes/react and
        wrap your app in {"<FeedbackProvider>"}. Both embeds share the same
        widget, options, and captured context. On React sites, every report also
        carries the component path. See the{" "}
        <DocLink href={"/docs/widget/install/script-embed" as Route}>
          script embed docs
        </DocLink>
        , the{" "}
        <DocLink href={"/docs/widget/install/react" as Route}>
          React embed docs
        </DocLink>
        , and the{" "}
        <DocLink href={"/docs/getting-started/quickstart" as Route}>
          quickstart
        </DocLink>
        .
      </VsFaqAnswer>
    ),
  },
  {
    question: "Does FasterFixes work on non-React stacks?",
    answer:
      "Yes. The script embed installs the widget with one script tag on any website: WordPress, Webflow, static HTML, or an app built with Vue, Angular, Svelte, or no framework at all. Every report carries the screenshot, DOM selector, URL, browser, viewport, and console and network logs. The React component path is added when the site runs React. Unlike Usersnap, FasterFixes has no browser extension, so the widget must be installed on the site.",
    content: (
      <VsFaqAnswer>
        Yes. The script embed installs the widget with one script tag on any
        website: WordPress, Webflow, static HTML, or an app built with Vue,
        Angular, Svelte, or no framework at all. Every report carries the
        screenshot, DOM selector, URL, browser, viewport, and console and
        network logs. The React component path is added when the site runs
        React. Unlike Usersnap, FasterFixes has no browser extension, so the
        widget must be installed on the site. See the{" "}
        <DocLink href={"/docs/widget/install/script-embed" as Route}>
          script embed docs
        </DocLink>
        .
      </VsFaqAnswer>
    ),
  },
  {
    question: "How do I migrate from Usersnap to FasterFixes?",
    answer:
      "Export your feedback from Usersnap (its REST API is on Premium and Enterprise only), then deploy FasterFixes (self-hosted or Pro). Replace the Usersnap snippet with the FasterFixes script tag, or with the React package in a React app. Note that survey workflows do not migrate. FasterFixes does not support those features. Connect GitHub, Linear, or Jira for two-way sync and configure @fasterfixes/mcp for your AI agent.",
  },
  {
    question: "Is FasterFixes open source?",
    answer:
      "Yes. The FasterFixes dashboard is licensed under AGPL-3.0 and the widget under MIT. The source code is publicly available. You can inspect it, self-host it, and contribute to it. Usersnap is proprietary and closed-source.",
  },
  {
    question: "What is the FasterFixes Agency plan?",
    answer: `The Agency plan costs $${agencyPrice}/month and includes unlimited members, unlimited projects, MCP server access, GitHub, Linear, and Jira two-way sync, team kanban, and email support. It is designed for agencies managing multiple client sites from a single workspace at a flat monthly rate.`,
  },
];
