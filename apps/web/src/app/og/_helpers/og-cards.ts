export type OgCardContent = {
  eyebrow: string;
  title: string;
  // A substring of `title`, framed like a Widget annotation.
  highlight?: string;
  tags?: readonly string[];
};

// Social card copy for every static public page, keyed by its path. Shorter
// and punchier than the SEO title: it is read at thumbnail size in a feed.
// Docs pages and blog posts take theirs from their frontmatter.
export const OG_CARDS: Record<string, OgCardContent> = {
  "/": {
    eyebrow: "Website feedback",
    title: "Let your AI coding agent handle client feedback",
    highlight: "AI coding agent",
    tags: ["Open source", "MCP server", "Free plan"],
  },
  "/features": {
    eyebrow: "Features",
    title: "Everything between a client click and a shipped fix",
    highlight: "a shipped fix",
    tags: ["Website annotation", "Bug replay", "MCP server"],
  },
  "/features/website-annotation": {
    eyebrow: "Website annotation",
    title: "Clients click, comment, and your agent fixes it",
    highlight: "your agent fixes it",
    tags: ["CSS selector", "Console logs", "One-minute replay"],
  },
  "/features/actionable-bug-reports": {
    eyebrow: "Bug reports",
    title: "Client bug reports you never have to decode",
    highlight: "never have to decode",
    tags: ["Page URL", "Console logs", "Session replay"],
  },
  "/pricing": {
    eyebrow: "Pricing",
    title: "Flat $20 a month. Not per seat.",
    highlight: "Not per seat.",
    tags: ["$0 self-hosted", "5 members included", "$99 unlimited"],
  },
  "/open-source": {
    eyebrow: "Open source",
    title: "The feedback widget you can self-host",
    highlight: "self-host",
    tags: ["AGPL-3.0 app", "MIT widget", "Vercel + Postgres"],
  },
  "/blog": {
    eyebrow: "Blog",
    title: "Guides and notes for teams shipping client work",
    highlight: "client work",
  },
  "/integrations/github": {
    eyebrow: "GitHub integration",
    title: "Client feedback becomes GitHub issues",
    highlight: "GitHub issues",
    tags: ["Screenshot", "CSS selector", "Status sync"],
  },
  "/integrations/jira": {
    eyebrow: "Jira integration",
    title: "Client feedback becomes Jira issues",
    highlight: "Jira issues",
    tags: ["Screenshot links", "Diagnostics", "Status category sync"],
  },
  "/integrations/linear": {
    eyebrow: "Linear integration",
    title: "Client feedback becomes Linear issues",
    highlight: "Linear issues",
    tags: ["Screenshot", "React component path", "Browser context"],
  },
  "/integrations/mcp": {
    eyebrow: "MCP server",
    title: "Client feedback, wired to your coding agent",
    highlight: "your coding agent",
    tags: ["Claude Code", "Cursor", "Codex"],
  },
  "/integrations/slack": {
    eyebrow: "Slack integration",
    title: "Know in Slack the moment a client reports a bug",
    highlight: "Slack",
    tags: ["Screenshot", "Page URL", "Status updates"],
  },
  "/vs/atarim": {
    eyebrow: "Comparison",
    title: "The open-source Atarim alternative",
    highlight: "open-source",
    tags: ["Self-hosted", "Flat pricing", "MCP server"],
  },
  "/vs/bugherd": {
    eyebrow: "Comparison",
    title: "The open-source BugHerd alternative",
    highlight: "open-source",
    tags: ["Self-hosted", "No seat fees", "MCP server"],
  },
  "/vs/gleap": {
    eyebrow: "Comparison",
    title: "The open-source Gleap alternative",
    highlight: "open-source",
    tags: ["Self-hosted", "Flat $20/mo", "MCP server"],
  },
  "/vs/marker-io": {
    eyebrow: "Comparison",
    title: "The open-source Marker.io alternative",
    highlight: "open-source",
    tags: ["Free self-hosted", "Flat rate", "MCP server"],
  },
  "/vs/markup-io": {
    eyebrow: "Comparison",
    title: "The developer-first Markup.io alternative",
    highlight: "developer-first",
    tags: ["Open source", "$20/mo flat", "Linear + Jira"],
  },
  "/vs/ruttl": {
    eyebrow: "Comparison",
    title: "The Ruttl alternative without per-seat pricing",
    highlight: "without per-seat pricing",
    tags: ["Open source", "Self-hosted", "MCP server"],
  },
  "/vs/userback": {
    eyebrow: "Comparison",
    title: "The open-source Userback alternative",
    highlight: "open-source",
    tags: ["Self-hosted", "React component tree", "MCP server"],
  },
  "/vs/usersnap": {
    eyebrow: "Comparison",
    title: "The open-source Usersnap alternative",
    highlight: "open-source",
    tags: ["Self-hosted", "No per-seat pricing", "Free to start"],
  },
};
