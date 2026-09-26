import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import { JiraIcon } from "@workspace/ui/components/icons/jira-icon";
import { LinearIcon } from "@workspace/ui/components/icons/linear-icon";
import { McpIcon } from "@workspace/ui/components/icons/mcp-icon";
import { SlackIcon } from "@workspace/ui/components/icons/slack-icon";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

type Integration = {
  label: string;
  href: Route;
  description: string;
  icon: React.ReactNode;
};

const integrations: Integration[] = [
  {
    label: "GitHub integration",
    href: "/integrations/github" as Route,
    description:
      "Auto-create GitHub issues from feedback with screenshot, CSS selector, and React component path. Bidirectional status sync.",
    icon: <GithubIcon className="size-5 shrink-0" />,
  },
  {
    label: "Linear integration",
    href: "/integrations/linear" as Route,
    description:
      "Auto-create Linear issues from feedback with full dev context. Status sync survives renamed and custom workflow states.",
    icon: <LinearIcon colored className="size-5 shrink-0" />,
  },
  {
    label: "Jira integration",
    href: "/integrations/jira" as Route,
    description:
      "Auto-create Jira Cloud issues from feedback with full dev context. Status sync keys on Jira's status category, so custom workflows keep working.",
    icon: <JiraIcon colored className="size-5 shrink-0" />,
  },
  {
    label: "Slack integration",
    href: "/integrations/slack" as Route,
    description:
      "Get notified in a Slack channel when feedback arrives or changes, with screenshot and status badge.",
    icon: <SlackIcon colored className="size-5 shrink-0" />,
  },
  {
    label: "MCP server",
    href: "/integrations/mcp" as Route,
    description:
      "Connect Claude Code, Cursor, and other coding agents to feedback. Fetch a full repro bundle, fix, and resolve from the terminal.",
    icon: <McpIcon className="size-5 shrink-0" />,
  },
];

export function IntegrationsSection() {
  return (
    <section className="w-full border-t py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Integrations
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Connects to the tools your team already uses
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Feedback flows into your project management workflow, no manual
            triage, no copy-pasting.
          </p>
        </div>

        <ul className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className="group block h-full">
                <Card className="h-full bg-muted/30 transition-colors hover:border-foreground">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      {item.icon}
                      {item.label}
                    </CardTitle>
                    <CardDescription className="leading-relaxed">
                      {item.description}
                    </CardDescription>
                    <CardAction>
                      <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                    </CardAction>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
