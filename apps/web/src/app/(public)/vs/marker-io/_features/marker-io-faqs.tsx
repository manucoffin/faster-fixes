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

const { team } = COMPETITOR_PRICES.markerIo.plans;
const teamAnnual = formatAmount(team.billedYearlyAmount, team.currency);

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

export const markerIoFaqs: VsFaqItem[] = [
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
      "Yes. The stack is Next.js, Postgres, Inngest, and R2 or S3-compatible storage. Marker.io has no self-hosted option. Deploy on your own infrastructure and run FasterFixes without a hosted account. The dashboard is AGPL-3.0; the widget packages are MIT.",
    content: (
      <VsFaqAnswer>
        Yes. The stack is Next.js, Postgres, Inngest, and R2 or S3-compatible
        storage. Marker.io has no self-hosted option. Deploy on your own
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
    question: "How is FasterFixes different from Marker.io?",
    answer:
      "FasterFixes is open-source and self-hostable; Marker.io is closed-source and cloud-only. FasterFixes ships an MCP server so AI coding agents (Claude Code, Cursor, Codex) can fetch and resolve feedback from the terminal. Marker.io has no MCP support. Marker.io has the broader feature set today: Figma/PDF annotation, deep PM integrations, and a client Guest Portal. FasterFixes does not currently match those features. Both replay the moments before a report: Marker.io bundles session replay from the Team plan, and FasterFixes attaches a Recording of the last minute on the page to each feedback on every plan.",
    content: (
      <VsFaqAnswer>
        FasterFixes is open-source and self-hostable; Marker.io is closed-source
        and cloud-only. FasterFixes ships an{" "}
        <DocLink href={"/docs/mcp/setup" as Route}>MCP server</DocLink> so AI
        coding agents (Claude Code, Cursor, Codex) can fetch and resolve
        feedback from the terminal. Marker.io has no MCP support. Marker.io has
        the broader feature set today: Figma/PDF annotation, deep PM
        integrations, and a client Guest Portal. FasterFixes does not currently
        match those features. Both replay the moments before a report: Marker.io
        bundles session replay from the Team plan, and FasterFixes attaches a{" "}
        <DocLink href={"/docs/widget/recording" as Route}>Recording</DocLink> of
        the last minute on the page to each feedback on every plan.
      </VsFaqAnswer>
    ),
  },
  {
    question: "Does FasterFixes have a kanban board?",
    answer:
      "Yes. The team dashboard includes a drag-and-drop kanban view. What FasterFixes does not have today is a client-facing board. Marker.io's Guest Portal covers that. The team kanban is available on every plan, including the free tier.",
  },
  {
    question: "What does the MCP integration do?",
    answer:
      "@fasterfixes/mcp exposes your open feedback to any MCP-compatible coding agent. Your agent can list unresolved feedback, read the full technical context (URL, DOM selector, React component path when available, browser, viewport), apply a fix, and mark the item resolved, all from the terminal. Marker.io has no equivalent.",
    content: (
      <VsFaqAnswer>
        @fasterfixes/mcp exposes your open feedback to any MCP-compatible coding
        agent. Your agent can list unresolved feedback, read the full technical
        context (URL, DOM selector, React component path when available,
        browser, viewport), apply a fix, and mark the item resolved, all from
        the terminal. Marker.io has no equivalent. See{" "}
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
      "Yes. The script embed installs the widget with one script tag on any website: WordPress, Webflow, static HTML, or an app built with Vue, Angular, Svelte, or no framework at all. It needs no framework runtime and renders in a Shadow DOM, so page styles do not affect it. The widget does need to be installed on the site. If reviewers must leave feedback on sites you cannot edit, Marker.io's browser extension is a better fit.",
    content: (
      <VsFaqAnswer>
        Yes. The script embed installs the widget with one script tag on any
        website: WordPress, Webflow, static HTML, or an app built with Vue,
        Angular, Svelte, or no framework at all. It needs no framework runtime
        and renders in a Shadow DOM, so page styles do not affect it. The widget
        does need to be installed on the site. If reviewers must leave feedback
        on sites you cannot edit, Marker.io&apos;s browser extension is a better
        fit. See the{" "}
        <DocLink href={"/docs/widget/install/script-embed" as Route}>
          script embed docs
        </DocLink>
        .
      </VsFaqAnswer>
    ),
  },
  {
    question: "Can I use Claude, GPT, or any other model with FasterFixes?",
    answer:
      "Yes. The MCP server is model-agnostic. Pick the agent you already use, whether Claude Code, Cursor, Codex, or any other MCP-compatible client, and the agent runs whichever model you have configured. Marker.io's AI features are bundled inside the dashboard and do not let you bring your own model.",
    content: (
      <VsFaqAnswer>
        Yes. The <DocLink href={"/docs/mcp/setup" as Route}>MCP server</DocLink>{" "}
        is model-agnostic. Pick the agent you already use, whether Claude Code,
        Cursor, Codex, or any other MCP-compatible client, and the agent runs
        whichever model you have configured. Marker.io&apos;s AI features (Title
        Generation, Magic Rewrite, Translation) are bundled inside the dashboard
        and do not let you bring your own model.
      </VsFaqAnswer>
    ),
  },
  {
    question: "How do I move my Marker.io data over?",
    answer:
      "Export your existing feedback as CSV from the Marker.io dashboard, set up a FasterFixes workspace (hosted or self-hosted), install the widget on your site, and reconnect your GitHub, Linear, and Jira integrations. Hand the export to your AI agent: the @fasterfixes/mcp create_feedbacks tool bulk-imports the items into FasterFixes, preserving original timestamps and attributing them to a named reviewer.",
  },
  {
    question:
      "How do the FasterFixes integrations compare to Marker.io's Jira-heavy stack?",
    answer: `FasterFixes ships two-way GitHub Issues, Linear, and Jira Cloud sync on every paid plan, included by default. A single feedback item can mirror to all three at once, and Jira sync maps by status category rather than status name, so custom workflows need no configuration. Marker.io includes Linear on every plan but gates Jira sync behind the Team plan at ${teamAnnual}/month annual. Marker.io still covers a broader roster: Asana, ClickUp, Trello, Monday.com and more. Weigh that if your backlog lives elsewhere.`,
    content: (
      <VsFaqAnswer>
        FasterFixes ships two-way GitHub Issues, Linear, and Jira Cloud sync on
        every paid plan, included by default. A single feedback item can mirror
        to all three at once, and Jira sync maps by status category rather than
        status name, so custom workflows need no configuration. Marker.io
        includes Linear on every plan but gates Jira sync behind the Team plan
        at {teamAnnual}/month annual. Marker.io still covers a broader roster:
        Asana, ClickUp, Trello, Monday.com and more. Weigh that if your backlog
        lives elsewhere. See the{" "}
        <DocLink href={"/docs/integrations/github" as Route}>
          GitHub integration docs
        </DocLink>{" "}
        and{" "}
        <DocLink href={"/docs/integrations/jira" as Route}>
          Jira integration docs
        </DocLink>
        .
      </VsFaqAnswer>
    ),
  },
];
