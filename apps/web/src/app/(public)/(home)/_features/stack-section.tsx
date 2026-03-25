import {
  CodeIcon,
  GitPullRequestIcon,
  GlobeIcon,
  TerminalIcon,
} from "lucide-react";

const categories = [
  {
    icon: GlobeIcon,
    title: "React apps",
    items: [
      "Next.js and any React-based framework",
      "Captures React component tree and source file hints",
      "Install via npm: @fasterfixes/react",
    ],
  },
  {
    icon: CodeIcon,
    title: "Your editor",
    items: ["Claude Code", "Cursor", "Windsurf", "Codex", "Any MCP-compatible agent"],
  },
  {
    icon: TerminalIcon,
    title: "MCP Protocol",
    items: [
      "list_feedbacks — fetch structured reports",
      "update_feedback_status — mark items as resolved",
      "Install with a single command",
    ],
  },
  {
    icon: GitPullRequestIcon,
    title: "GitHub",
    items: [
      "Auto-create issues from feedback with full context",
      "Bidirectional status sync — close an issue, resolve the feedback",
      "Available on Pro and Agency plans",
    ],
  },
];

export function StackSection() {
  return (
    <section className="bg-muted/50 w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Built for your stack
          </h2>
          <p className="text-muted-foreground mt-4 text-lg md:text-xl">
            The widget is available for React-based apps today. The MCP server
            connects to any agent that supports the Model Context Protocol.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {categories.map((category) => (
            <div key={category.title} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <category.icon className="text-primary size-6" />
                <h3 className="text-lg font-semibold">{category.title}</h3>
              </div>
              <ul className="flex flex-col gap-2">
                {category.items.map((item) => (
                  <li
                    key={item}
                    className="text-muted-foreground text-sm leading-relaxed"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
