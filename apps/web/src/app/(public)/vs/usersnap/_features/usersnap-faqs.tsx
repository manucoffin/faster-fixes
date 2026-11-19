import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { VsFaqAnswer, type VsFaqItem } from "../../_features/vs-faq-section";

const freePlan = PLAN_LIMITS[SubscriptionPlanName.Free];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];

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
      "FasterFixes is open-source and self-hostable; Usersnap is closed-source and cloud-only. FasterFixes ships an MCP server so AI coding agents (Claude Code, Cursor, Codex) can fetch and resolve feedback from the terminal. Usersnap is a broader platform focused on NPS surveys, microsurveys, and feature request boards. FasterFixes does not currently offer those features. FasterFixes is built specifically for developer teams who need structured bug reports, not product feedback surveys.",
    content: (
      <VsFaqAnswer>
        FasterFixes is open-source and self-hostable; Usersnap is closed-source
        and cloud-only. FasterFixes ships an{" "}
        <DocLink href={"/docs/mcp/setup" as Route}>MCP server</DocLink> so AI
        coding agents (Claude Code, Cursor, Codex) can fetch and resolve
        feedback from the terminal. Usersnap is a broader platform focused on
        NPS surveys, microsurveys, and feature request boards. FasterFixes does
        not currently offer those features.
      </VsFaqAnswer>
    ),
  },
  {
    question: "Does FasterFixes support NPS surveys?",
    answer:
      "No. FasterFixes does not currently support NPS surveys, CSAT microsurveys, or feature request boards. If those workflows are central to your process, Usersnap is the better fit. FasterFixes is focused on visual bug reports and structured feedback for developer teams.",
  },
  {
    question: "What does the MCP integration do?",
    answer:
      "@fasterfixes/mcp exposes your open feedback to any MCP-compatible coding agent. Your agent can list unresolved feedback, read the full technical context (URL, DOM selector, React component path when available, browser, viewport), apply a fix, and mark the item resolved, all from the terminal. Usersnap's MCP server targets product analysis instead: it searches feedback, summarizes topics, and creates opportunities, but cannot edit existing feedback.",
    content: (
      <VsFaqAnswer>
        @fasterfixes/mcp exposes your open feedback to any MCP-compatible coding
        agent. Your agent can list unresolved feedback, read the full technical
        context (URL, DOM selector, React component path when available,
        browser, viewport), apply a fix, and mark the item resolved, all from
        the terminal. Usersnap&apos;s MCP server targets product analysis
        instead: it searches feedback, summarizes topics, and creates
        opportunities, but cannot edit existing feedback. See{" "}
        <DocLink href={"/docs/mcp/setup" as Route}>MCP setup</DocLink> and the{" "}
        <DocLink href={"/docs/mcp/tools" as Route}>tool reference</DocLink>.
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
      "Export your feedback data from Usersnap via CSV or API, then deploy FasterFixes (self-hosted or Pro). Replace the Usersnap snippet with the FasterFixes script tag, or with the React package in a React app. Note that NPS and survey workflows do not migrate. FasterFixes does not support those features. Connect GitHub, Linear, or Jira for two-way sync and configure @fasterfixes/mcp for your AI agent.",
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
