import { Button } from "@workspace/ui/components/button";
import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import { JiraIcon } from "@workspace/ui/components/icons/jira-icon";
import { LinearIcon } from "@workspace/ui/components/icons/linear-icon";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { SectionBody } from "../../_components/section-body";
import { SectionHeading } from "../../_components/section-heading";
import { AgentMcpSessionAnimation } from "../_components/illustrations/agent-mcp-session-animation";
import { IssueAndSlackIllustration } from "../_components/illustrations/issue-and-slack-illustration";

const trackers = [
  { label: "GitHub", href: "/integrations/github", Icon: GithubIcon },
  { label: "Linear", href: "/integrations/linear", Icon: LinearIcon },
  { label: "Jira", href: "/integrations/jira", Icon: JiraIcon },
];

export function ActionableBugReportsDestinations() {
  return (
    <section className="w-full bg-muted/50 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <SectionHeading>
          Send bug reports to GitHub, Linear or Jira, or to your coding agent
        </SectionHeading>

        <div className="mt-12 flex flex-col gap-20 md:gap-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h3 className="text-xl font-medium tracking-tight">
                Your whole team reads the same report
              </h3>
              <SectionBody className="mt-4">
                <p>
                  Reports land on a Kanban board where you sort, assign and
                  close them. Connect GitHub, Linear or Jira and each one also
                  becomes an issue with the comment, the screenshot, the logs
                  and a link to the replay, so developers work from the tracker
                  they already use.
                </p>
              </SectionBody>

              <div className="mt-8 flex flex-wrap gap-3">
                {trackers.map(({ label, href, Icon }) => (
                  <Button key={label} asChild variant="outline">
                    <Link href={href as Route}>
                      <Icon className="size-4" />
                      {label}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>

            <div className="lg:order-first">
              <IssueAndSlackIllustration />
            </div>
          </div>

          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h3 className="text-xl font-medium tracking-tight">
                Your coding agent fixes it with the full context
              </h3>
              <SectionBody className="mt-4">
                <p>
                  You watch the replay and read the comment. Through the MCP
                  server, Claude Code, Cursor or any MCP client reads far more:
                  each report as markdown, with the selector, the screenshot,
                  the console and network logs, and the recording as a
                  step-by-step timeline. With that context, it finds the code,
                  makes the fix and marks the report resolved.
                </p>
              </SectionBody>

              <Button asChild className="mt-8">
                <Link href={"/integrations/mcp" as Route}>
                  Set up the MCP server
                  <ArrowRightIcon />
                </Link>
              </Button>
            </div>

            <AgentMcpSessionAnimation />
          </div>
        </div>
      </div>
    </section>
  );
}
