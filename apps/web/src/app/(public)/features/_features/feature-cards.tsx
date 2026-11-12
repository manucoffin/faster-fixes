import type { Route } from "next";
import Link from "next/link";

type Feature = {
  title: string;
  description: string;
  href?: Route;
  linkLabel?: string;
};

const features: Feature[] = [
  {
    title: "Website annotation",
    description:
      "Clients click an element on your site and comment. The report arrives with the selector, a screenshot, the page URL and browser data, and masking keeps sensitive data out of it.",
    href: "/features/website-annotation" as Route,
    linkLabel: "Learn about website annotation",
  },
  {
    title: "Bug reports with a replay",
    description:
      "Each feedback carries the console and network history and a replay of the last minute before the reviewer clicked, so a developer can reproduce it without a follow-up question.",
    href: "/docs/widget/recording" as Route,
    linkLabel: "Read the recording docs",
  },
  {
    title: "Video review",
    description:
      "Upload a video and share a link. Clients mark the exact moment or a range and point at the frame, with no account needed.",
    href: "/#video-review" as Route,
    linkLabel: "See video review",
  },
  {
    title: "Kanban board",
    description:
      "Site and video feedback land on the same board, where your team triages, assigns and moves each item from new to resolved.",
  },
  {
    title: "MCP server",
    description:
      "Your coding agent fetches feedback with its full context, fixes the code and marks the item resolved from the terminal.",
    href: "/integrations/mcp" as Route,
    linkLabel: "Learn about the MCP server",
  },
];

export function FeatureCards() {
  return (
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {features.map((feature) => (
        <li key={feature.title} className="flex flex-col rounded-lg border p-6">
          <h2 className="text-xl font-semibold">{feature.title}</h2>
          <p className="mt-2 flex-1 text-muted-foreground">
            {feature.description}
          </p>
          {feature.href && (
            <Link
              href={feature.href}
              className="mt-4 text-sm font-medium underline underline-offset-4 hover:no-underline"
            >
              {feature.linkLabel}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
