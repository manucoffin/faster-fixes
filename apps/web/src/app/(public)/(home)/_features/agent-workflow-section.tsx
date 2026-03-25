import { GitPullRequestIcon, LayoutDashboardIcon, TerminalIcon } from "lucide-react";

const dashboardSteps = [
  "Open your dashboard, review new feedback",
  "Copy the structured markdown report",
  "Paste it into your coding agent",
  "The agent locates the code and applies the fix",
];

const mcpSteps = [
  "Ask your agent to check for new feedback",
  "The agent calls the MCP server and receives the structured report",
  "It locates the code and applies the fix",
  "It marks the feedback as resolved via MCP",
];

const githubSteps = [
  "Connect your GitHub repo in project settings",
  "New feedback automatically creates a GitHub issue with full context",
  "Closing an issue marks the feedback as resolved — and vice versa",
  "Status stays in sync across both tools",
];

export function AgentWorkflowSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Fits into your existing workflow
          </h2>
          <p className="text-muted-foreground mt-4 text-lg md:text-xl">
            Use the dashboard, connect the MCP server to your coding agent, or
            let GitHub Issues handle the routing. Pick what works for your team.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border p-6">
            <div className="mb-4 flex items-center gap-3">
              <LayoutDashboardIcon className="text-muted-foreground size-5" />
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                Dashboard
              </h3>
            </div>
            <ol className="flex flex-col gap-3">
              {dashboardSteps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm">
                  <span className="text-muted-foreground mt-0.5 shrink-0 font-medium">
                    {index + 1}.
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="border-primary/20 bg-primary/5 rounded-lg border p-6">
            <div className="mb-4 flex items-center gap-3">
              <TerminalIcon className="text-primary size-5" />
              <h3 className="text-primary text-sm font-semibold uppercase tracking-wider">
                MCP Server
              </h3>
            </div>
            <ol className="flex flex-col gap-3">
              {mcpSteps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm">
                  <span className="text-primary mt-0.5 shrink-0 font-medium">
                    {index + 1}.
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="text-primary/80 mt-4 text-sm font-medium">
              You never leave your editor.
            </p>
          </div>

          <div className="rounded-lg border p-6">
            <div className="mb-4 flex items-center gap-3">
              <GitPullRequestIcon className="text-muted-foreground size-5" />
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                GitHub Issues
              </h3>
            </div>
            <ol className="flex flex-col gap-3">
              {githubSteps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm">
                  <span className="text-muted-foreground mt-0.5 shrink-0 font-medium">
                    {index + 1}.
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <p className="text-muted-foreground mx-auto mt-8 max-w-2xl text-center text-sm">
          MCP works with Claude Code, Cursor, Windsurf, and any agent that
          supports the Model Context Protocol.
        </p>
      </div>
    </section>
  );
}
