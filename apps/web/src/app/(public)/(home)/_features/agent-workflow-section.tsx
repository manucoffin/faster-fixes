import { signupUrl } from "@/app/_constants/routes";
import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon, LayoutDashboardIcon, TerminalIcon } from "lucide-react";
import Link from "next/link";

export function AgentWorkflowSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Let your agent handle it. Or stay in the loop.
          </h2>
          <p className="text-muted-foreground mt-4 text-lg md:text-xl">
            Your clients flag issues. Your agent fixes them. You review the
            diff.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg border p-6">
            <div className="mb-4 flex items-center gap-3">
              <TerminalIcon className="text-muted-foreground size-5" />
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                Full automation
              </h3>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed md:text-xl">
              Connect the MCP server once. Your agent fetches new feedback,
              locates the code, applies the fix, and marks it resolved. Fully
              unattended.
            </p>
          </div>

          <div className="rounded-lg border p-6">
            <div className="mb-4 flex items-center gap-3">
              <LayoutDashboardIcon className="text-muted-foreground size-5" />
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                Manual review
              </h3>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed md:text-xl">
              Open the dashboard, review incoming feedback, and copy the
              structured report into your coding agent when you are ready to
              act.
            </p>
          </div>
        </div>

        <p className="text-muted-foreground mx-auto mt-8 max-w-2xl text-center text-sm">
          MCP works with Claude Code, Cursor, Windsurf, and any agent that
          supports the Model Context Protocol.
        </p>

        <div className="mt-8 flex justify-center">
          <Button asChild size="lg">
            <Link href={signupUrl}>
              Get Started Free
              <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
