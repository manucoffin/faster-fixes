import type { Route } from "next";

type FeatureLink = {
  // Also the card's `id` on /features, so a feature without a page links to its card.
  slug: string;
  title: string;
  summary: string;
  description: string;
  href: Route;
  linkLabel?: string;
};

// Titles and link labels repeat each target page's primary keyword, for SEO.
export const featureLinks: FeatureLink[] = [
  {
    slug: "website-annotation",
    title: "Website annotation tool",
    summary: "Clients click an element on your site and comment.",
    description:
      "Clients click an element on your site and comment. The report arrives with the selector, a screenshot, the page URL and browser data, and masking keeps sensitive data out of it.",
    href: "/features/website-annotation" as Route,
    linkLabel: "Explore the website annotation tool",
  },
  {
    slug: "website-bug-reporting",
    title: "Website bug reporting tool",
    summary: "Bug reports with a replay, console and network logs.",
    description:
      "Each bug report carries the console and network history and a replay of the last minute before the reviewer clicked, so a developer can reproduce it without a follow-up question.",
    href: "/features/actionable-bug-reports" as Route,
    linkLabel: "Explore the website bug reporting tool",
  },
  {
    slug: "video-review",
    title: "Video review",
    summary: "Clients comment on the exact moment of a video.",
    description:
      "Upload a video and share a link. Clients mark the exact moment or a range and point at the frame, with no account needed.",
    href: "/#video-review" as Route,
    linkLabel: "See video review",
  },
  {
    slug: "kanban-board",
    title: "Kanban board",
    summary: "Triage, assign and resolve every piece of feedback.",
    description:
      "Site and video feedback land on the same board, where your team triages, assigns and moves each item from new to resolved.",
    href: "/features#kanban-board" as Route,
  },
  {
    slug: "mcp-server",
    title: "MCP server",
    summary: "Your coding agent fetches and fixes feedback.",
    description:
      "Your coding agent fetches feedback with its full context, fixes the code and marks the item resolved from the terminal.",
    href: "/integrations/mcp" as Route,
    linkLabel: "Learn about the MCP server for coding agents",
  },
];
