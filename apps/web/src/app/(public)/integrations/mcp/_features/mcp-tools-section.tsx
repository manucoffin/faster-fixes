import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

type Tool = {
  name: string;
  body: ReactNode;
  code: string;
};

// page_url filters on the full submission URL (the tool validates it as a URL);
// feedback IDs are UUIDs, not a prefixed format.
const tools: Tool[] = [
  {
    name: "list_feedbacks",
    body: "Fetch feedback items from your project. Filter by status, by page URL, or both. Returns agent-readable markdown by default, with the full repro bundle on every item.",
    code: 'list_feedbacks(\n  status="new",\n  page_url="https://staging.acme.com/checkout"\n)',
  },
  {
    name: "update_feedback_status",
    body: "Move an item through its lifecycle, new → in progress → resolved → closed, so your dashboard reflects real progress as the agent works.",
    code: 'update_feedback_status(\n  feedback_id="2a4f8c1e-9b3d-4c7a-8e21-5f6b0d9c1a2e",\n  status="resolved"\n)',
  },
  {
    name: "create_feedbacks",
    body: "Bulk-import up to 100 items per call from a parsed CSV or JSON export. The batch is atomic and deliberately skips integration fan-out, so importing 80 items won't auto-open 80 GitHub issues.",
    code: 'create_feedbacks(\n  feedbacks=[...],\n  source="bugherd",\n  reviewer_name="Imported feedback"\n)',
  },
];

export function McpToolsSection() {
  return (
    <section className="w-full bg-muted/50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Three MCP tools
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Enough surface to run the whole loop
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6">
          {tools.map((tool) => (
            <div
              key={tool.name}
              className="grid grid-cols-1 gap-6 rounded-xl border bg-background p-6 md:grid-cols-2 md:items-center"
            >
              <div>
                <h3 className="font-mono text-lg font-semibold">{tool.name}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {tool.body}
                </p>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                <code>{tool.code}</code>
              </pre>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-muted-foreground">
          See the{" "}
          <Link
            href={"/docs/mcp/tools" as Route}
            className="text-foreground underline underline-offset-4 hover:no-underline"
          >
            tool reference
          </Link>{" "}
          for every parameter.
        </p>
      </div>
    </section>
  );
}
