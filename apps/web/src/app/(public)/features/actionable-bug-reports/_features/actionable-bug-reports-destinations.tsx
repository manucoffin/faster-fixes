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
import { InboxBoardCopyAnimation } from "../_components/illustrations/inbox-board-copy-animation";
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
        <SectionHeading>Where the report goes</SectionHeading>

        <div className="mt-12 flex flex-col gap-20 md:gap-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h3 className="text-xl font-medium tracking-tight">The inbox</h3>
              <SectionBody className="mt-4">
                <p>
                  Feedbacks arrive on a Kanban board and in the inbox, where the
                  team triages, assigns and moves them from new to in progress
                  to resolved. A &quot;copy as markdown&quot; action puts any
                  Feedback on the clipboard as plain text.
                </p>
              </SectionBody>
            </div>

            <InboxBoardCopyAnimation />
          </div>

          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h3 className="text-xl font-medium tracking-tight">
                GitHub, Linear and Jira
              </h3>
              <SectionBody className="mt-4">
                <p>
                  Issues are created automatically in GitHub, Linear and Jira.
                  Each issue carries the comment, the page URL, the selector,
                  the browser information, a link to the Screenshot, and the
                  console and network logs in a collapsible section. When the
                  Feedback has a Recording, the issue also carries a &quot;Play
                  in Faster Fixes&quot; link with its duration, such as 48 s,
                  and a collapsed Timeline section.{" "}
                  <span className="text-foreground">
                    The player link requires a login, so a public repository
                    exposes nothing of the Recording.
                  </span>{" "}
                  Slack notifications carry a &quot;Play recording&quot; button.
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
                Coding agents over MCP
              </h3>
              <SectionBody className="mt-4">
                <p>
                  A coding agent reads the same Feedbacks. It calls{" "}
                  <code>list_feedbacks</code> to get each report as markdown
                  with its full context, <code>get_feedback</code> to read one
                  in full with the Screenshot as an image and the Timeline, then{" "}
                  <code>update_feedback_status</code> to mark it resolved.
                  Claude Code, Cursor, Windsurf, VS Code, Codex and Zed are
                  supported, and the MCP server works on the Free plan.
                </p>
              </SectionBody>

              <Button asChild variant="outline" className="mt-8">
                <Link href={"/integrations/mcp" as Route}>
                  Setup is on the MCP server page
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
