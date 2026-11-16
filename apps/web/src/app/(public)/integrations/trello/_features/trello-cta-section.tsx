import { Button } from "@workspace/ui/components/button";
import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import { JiraIcon } from "@workspace/ui/components/icons/jira-icon";
import { LinearIcon } from "@workspace/ui/components/icons/linear-icon";
import { SlackIcon } from "@workspace/ui/components/icons/slack-icon";
import { ArrowRightIcon, ArrowUpRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { SectionBody } from "../../../features/_components/section-body";
import { SectionHeading } from "../../../features/_components/section-heading";

const otherIntegrations = [
  {
    label: "GitHub",
    description: "Each feedback as an issue.",
    href: "/integrations/github",
    Icon: GithubIcon,
  },
  {
    label: "Linear",
    description: "Each feedback as a Linear issue.",
    href: "/integrations/linear",
    Icon: LinearIcon,
  },
  {
    label: "Jira",
    description: "Each feedback as a Jira issue.",
    href: "/integrations/jira",
    Icon: JiraIcon,
  },
  {
    label: "Slack",
    description: "A message in your channel for each new feedback.",
    href: "/integrations/slack",
    Icon: SlackIcon,
  },
];

export function TrelloCtaSection() {
  return (
    <section className="w-full bg-muted/50 py-20 md:py-28">
      <div className="container mx-auto grid grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading className="md:text-5xl">
            Bring your next review round to Trello
          </SectionHeading>

          <SectionBody className="mt-6 max-w-xl">
            <p>
              Included in every paid plan. Self-hosting? Register your own
              Trello OAuth client and the integration works on your instance.
            </p>
          </SectionBody>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href={"/docs/integrations/trello" as Route}>
                Read the docs
                <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border bg-background p-2">
          <p className="px-4 pt-4 pb-2 text-sm text-muted-foreground">
            The same project can mirror to Trello and these at once.
          </p>
          <ul className="flex flex-col">
            {otherIntegrations.map(({ label, description, href, Icon }) => (
              <li key={label}>
                <Link
                  href={href as Route}
                  className="group flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background">
                    <Icon className="size-5" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium">{label}</span>
                    <span className="truncate text-sm text-muted-foreground">
                      {description}
                    </span>
                  </span>
                  <ArrowUpRightIcon
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
