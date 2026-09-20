import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

type SetupStep = { label: string; body: string; content?: ReactNode };

export const mcpSetupSteps: SetupStep[] = [
  {
    label: "Create an agent token",
    body: "On the Integrations page in your Faster Fixes account, create an agent token under MCP Server and grant the scopes the agent needs. Read, update, and create are separate permissions. Leave any unchecked to lock the agent out of that operation.",
    content: (
      <p className="mt-2 leading-relaxed text-muted-foreground">
        On the{" "}
        <Link
          href={"/integrations" as Route}
          className="text-foreground underline underline-offset-4 hover:no-underline"
        >
          Integrations page
        </Link>{" "}
        in your Faster Fixes account, create an agent token under MCP Server and
        grant the scopes the agent needs. Read, update, and create are separate
        permissions. Leave any unchecked to lock the agent out of that
        operation.
      </p>
    ),
  },
  {
    label: "Add the server to your agent",
    body: "One command, no global install. Point it at the token and your project ID. Config formats differ per editor: JSON for most, TOML for Codex. The setup docs cover each one.",
  },
  {
    label: "Fetch, fix, resolve",
    body: 'Ask your agent to "fix feedback" and it runs the full loop: pull new items, fix the code, mark each resolved. Or call the three tools directly.',
  },
];

const installCommand = `claude mcp add faster-fixes -s project \\
  --env FASTER_FIXES_TOKEN=ff_agent_xxx \\
  --env FASTER_FIXES_PROJECT=proj_xxx \\
  -- npx -y @fasterfixes/mcp`;

export function McpHowItWorksSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            How it works
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Add it to your agent in one command
          </h2>
        </div>

        <ol className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
          {mcpSetupSteps.map((step, i) => (
            <li
              key={step.label}
              className="flex gap-4 rounded-xl border bg-muted/30 p-6"
            >
              <span className="font-mono text-sm text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-semibold">{step.label}</h3>
                {step.content ?? (
                  <p className="mt-2 leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="mx-auto mt-10 max-w-3xl">
          <p className="mb-2 text-sm font-semibold text-muted-foreground">
            Claude Code
          </p>
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <code>{installCommand}</code>
          </pre>
        </div>

        <div className="mt-10 flex justify-center">
          <Button asChild size="lg">
            <Link href={"/docs/mcp/setup" as Route}>
              Full setup guide
              <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
