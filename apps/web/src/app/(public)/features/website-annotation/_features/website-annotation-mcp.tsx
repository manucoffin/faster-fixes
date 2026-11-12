import type { Route } from "next";
import Link from "next/link";
import { BoardMatchesBranchAnimation } from "../_components/illustrations/board-matches-branch-animation";
import { SectionBody } from "../_components/section-body";
import { SectionHeading } from "../_components/section-heading";

const mcpSetupCommand = `claude mcp add faster-fixes -s project \\
  --env FASTER_FIXES_TOKEN=ff_agent_xxx \\
  --env FASTER_FIXES_PROJECT=proj_xxx \\
  -- npx -y @fasterfixes/mcp`;

export function WebsiteAnnotationMcp() {
  return (
    <section className="w-full bg-muted/50 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <SectionHeading>
          From annotation to fix: feedback your coding agent reads through MCP
        </SectionHeading>

        <div className="mt-12 grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionBody>
            <p>
              <span className="text-foreground">
                The report is written to be read twice: once by you, once by an
                agent.
              </span>{" "}
              Through the{" "}
              <Link href={"/integrations/mcp" as Route}>MCP server</Link> your
              coding agent calls <code>list_feedbacks</code>, filters by{" "}
              <code>status</code> and <code>page_url</code>, and receives
              agent-readable markdown with the full repro bundle on every item.
              It edits the code, then calls <code>update_feedback_status</code>{" "}
              to move the item from new to in progress to resolved, so the board
              matches the branch.
            </p>
            <p>
              <code>create_feedbacks</code> imports up to 100 items per call
              from a CSV or JSON export, atomically and without opening an issue
              per row.
            </p>
          </SectionBody>

          <BoardMatchesBranchAnimation />
        </div>

        <div className="mt-16 grid grid-cols-1 items-start gap-12 md:mt-20 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-lg text-muted-foreground">
              Setup is one command, no global install:
            </p>
            <div className="mt-4 overflow-hidden rounded-2xl border bg-background">
              <div className="border-b px-5 py-3 font-mono text-xs text-muted-foreground">
                Claude Code
              </div>
              <pre className="overflow-x-auto px-5 py-4 font-mono text-sm leading-relaxed">
                <code>{mcpSetupCommand}</code>
              </pre>
            </div>
          </div>

          <SectionBody className="lg:pt-11">
            <p>
              Claude Code, Cursor, Windsurf, VS Code, Codex and Zed are each
              covered in the{" "}
              <Link href={"/docs/mcp/setup" as Route}>MCP setup docs</Link>.
              Tokens are scoped per capability: read, update and create are
              separate permissions, and nothing delete or admin is exposed. You
              revoke one from the dashboard without a redeploy. The server works
              on the Free plan, and <code>FASTER_FIXES_URL</code> points it at
              your own instance.
            </p>
          </SectionBody>
        </div>
      </div>
    </section>
  );
}
