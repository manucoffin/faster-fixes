import { PLAN_LIMITS, SubscriptionPlanName } from "@/app/_domains/subscription";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { VsFaqAnswer, type VsFaqItem } from "../../_features/vs-faq-section";

const freePlan = PLAN_LIMITS[SubscriptionPlanName.Free];

const freeFeedbackLimit = PLAN_LIMITS[SubscriptionPlanName.Free].feedbacks;

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
    question: "Is FasterFixes free?",
    answer: `Yes. The free plan includes ${freePlan.projects} project, ${freeFeedbackLimit} feedback items, and ${freePlan.seats} member, no credit card required. The self-hosted version is also free under AGPL-3.0; you only pay for your own hosting infrastructure (typically $5-20/month on Railway or Vercel).`,
    content: (
      <VsFaqAnswer>
        Yes. The free plan includes {freePlan.projects} project,{" "}
        {freeFeedbackLimit} feedback items, and {freePlan.seats} member, no
        credit card required. The self-hosted version is also free under
        AGPL-3.0; you only pay for your own hosting infrastructure (typically
        $5-20/month on Railway or Vercel). See the{" "}
        <DocLink href={"/docs/self-hosting" as Route}>
          self-hosting guide
        </DocLink>
        .
      </VsFaqAnswer>
    ),
  },
  {
    question: "Can I self-host FasterFixes?",
    answer:
      "Yes. The stack is Next.js, Postgres, Inngest, and R2 or S3-compatible storage. Userback has no self-hosted option. Deploy on Vercel, Railway, or any Node-compatible host. The dashboard is AGPL-3.0; the widget packages are MIT.",
    content: (
      <VsFaqAnswer>
        Yes. The stack is Next.js, Postgres, Inngest, and R2 or S3-compatible
        storage. Userback has no self-hosted option. Deploy on Vercel, Railway,
        or any Node-compatible host. The dashboard is AGPL-3.0; the widget
        packages are MIT. Full instructions in the{" "}
        <DocLink href={"/docs/self-hosting" as Route}>
          self-hosting guide
        </DocLink>
        .
      </VsFaqAnswer>
    ),
  },
  {
    question: "How is FasterFixes different from Userback?",
    answer:
      "FasterFixes is open-source and self-hostable; Userback is closed-source and cloud-only. FasterFixes captures DOM selector, URL, browser, and viewport on every report, plus the React component tree on React sites. Userback is a broader platform with annotated video, session replay, NPS surveys, and a feature portal. FasterFixes attaches a Recording of the last minute on the page to each report, but offers no screen recording, surveys, or feature portal. FasterFixes is built specifically for developer teams who need structured bug reports, not a full product analytics suite.",
    content: (
      <VsFaqAnswer>
        FasterFixes is open-source and self-hostable; Userback is closed-source
        and cloud-only. FasterFixes captures DOM selector, URL, browser, and
        viewport on every report, plus the React component tree on React sites.
        Userback is a broader platform with annotated video, session replay, NPS
        surveys, and a feature portal. FasterFixes attaches a{" "}
        <DocLink href={"/docs/widget/recording" as Route}>Recording</DocLink> of
        the last minute on the page to each report, but offers no screen
        recording, surveys, or feature portal.
      </VsFaqAnswer>
    ),
  },
  {
    question: "Does FasterFixes have video recording?",
    answer:
      "Not screen recording, and no voice. The widget captures screenshots, component tree, DOM selector, URL, browser, and viewport, and attaches a Recording of the last minute on the page to each report: a reconstruction of the page, not a video of the screen. FasterFixes does support video review: upload a video to a project, share its link, and clients leave feedback on an exact moment or range without an account. For recording a screen or a voice while reporting a bug, Userback or a dedicated tool like Loom is a better fit.",
  },
  {
    question: "Does FasterFixes have session replay?",
    answer:
      "Yes, for the moments before each report: every feedback carries a Recording of up to the last minute on the page, on every plan, and typed values are never captured. No for session analytics: FasterFixes does not record whole visits or aggregate sessions. If session analytics is a core requirement, Userback Business Plus (whole-visit recording at custom pricing) or a dedicated tool like LogRocket is a better fit.",
    content: (
      <VsFaqAnswer>
        Yes, for the moments before each report: every feedback carries a{" "}
        <DocLink href={"/docs/widget/recording" as Route}>Recording</DocLink> of
        up to the last minute on the page, on every plan, and typed values are
        never captured. No for session analytics: FasterFixes does not record
        whole visits or aggregate sessions. If session analytics is a core
        requirement, Userback Business Plus (whole-visit recording at custom
        pricing) or a dedicated tool like LogRocket is a better fit.
      </VsFaqAnswer>
    ),
  },
  {
    question: "What does the MCP server do?",
    answer:
      "@fasterfixes/mcp connects Claude Code, Cursor, and Codex to your FasterFixes workspace. Feedback items are accessible directly in the terminal, no browser tab switching, no copy-pasting issue descriptions into a chat window. Userback also offers an MCP server, but FasterFixes is open-source and self-hostable end to end.",
    content: (
      <VsFaqAnswer>
        @fasterfixes/mcp connects Claude Code, Cursor, and Codex to your
        FasterFixes workspace. Feedback items are accessible directly in the
        terminal, no browser tab switching, no copy-pasting issue descriptions
        into a chat window. Userback also offers an MCP server, but FasterFixes
        is open-source and self-hostable end to end. See{" "}
        <DocLink href={"/docs/mcp/setup" as Route}>MCP setup</DocLink> and the{" "}
        <DocLink href={"/docs/mcp/tools" as Route}>tool reference</DocLink>.
      </VsFaqAnswer>
    ),
  },
  {
    question: "How do I install FasterFixes on my site?",
    answer:
      "Add one script tag with your Project ID to any site: WordPress, Webflow, static HTML, or an app built with Vue, Angular, Svelte, or any other framework. In a React or Next.js app, you can instead run npm install @fasterfixes/react and wrap the app in FeedbackProvider with your Project ID. Both embeds share the same widget, options, and captured context.",
    content: (
      <VsFaqAnswer>
        Add one script tag with your Project ID to any site: WordPress, Webflow,
        static HTML, or an app built with Vue, Angular, Svelte, or any other
        framework. In a React or Next.js app, you can instead run npm install
        @fasterfixes/react and wrap the app in FeedbackProvider with your
        Project ID. Both embeds share the same widget, options, and captured
        context. See the{" "}
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
      "Yes. The script embed installs the widget with one script tag on any site, with the same screenshot, DOM selector, URL, browser, viewport, console, and network capture as the React embed. The React component path is added when the site runs React. Unlike Userback, FasterFixes does not offer a browser extension.",
    content: (
      <VsFaqAnswer>
        Yes. The script embed installs the widget with one script tag on any
        site, with the same screenshot, DOM selector, URL, browser, viewport,
        console, and network capture as the React embed. The React component
        path is added when the site runs React. Unlike Userback, FasterFixes
        does not offer a browser extension. See the{" "}
        <DocLink href={"/docs/widget/install/script-embed" as Route}>
          script embed docs
        </DocLink>
        .
      </VsFaqAnswer>
    ),
  },
  {
    question: "How do I migrate from Userback?",
    answer:
      "Export your feedback as CSV from Userback (Settings > Export), then deploy or sign up for FasterFixes, install the widget, and connect GitHub, Linear, and Jira (any combination) on a paid plan. Note that screen recordings, session replays, and survey responses do not migrate. FasterFixes has no screen recording or surveys, and a Recording is captured with each new feedback, so existing Userback replays cannot be imported. The full 4-step guide is in the migration section above.",
  },
  {
    question: "Is FasterFixes open source?",
    answer:
      "Yes. The FasterFixes dashboard is licensed under AGPL-3.0 and the widget under MIT. The source code is publicly available on GitHub. You can inspect it, self-host it, and contribute to it. Userback is proprietary and closed-source.",
  },
];
