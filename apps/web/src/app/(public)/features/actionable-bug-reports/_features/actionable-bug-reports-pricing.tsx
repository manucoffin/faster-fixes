import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { SectionBody } from "../../_components/section-body";
import { SectionHeading } from "../../_components/section-heading";

export function ActionableBugReportsPricing() {
  return (
    <section className="w-full bg-muted/50 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <SectionHeading>Pricing and licence</SectionHeading>

        <div className="mt-12 grid grid-cols-1 divide-y overflow-hidden rounded-2xl border bg-background lg:grid-cols-[3fr_2fr] lg:divide-x lg:divide-y-0">
          <div className="flex flex-col items-start gap-8 p-6 md:p-8">
            <SectionBody>
              <p>
                <span className="text-foreground">
                  The Free plan is not time-limited:
                </span>{" "}
                one project, up to 20 feedback items, one team member, one video
                up to 500 MB, the widget, the Recording of the last minute
                before each Feedback and the feedback dashboard. The MCP server
                is available on every plan. GitHub, Linear, Jira and Slack need
                Pro at $20 per month flat for up to 5 members, or Agency at $99
                per month with unlimited members. Data is never deleted when a
                plan ends.
              </p>
            </SectionBody>

            <Button asChild variant="outline" className="mt-auto">
              <Link href="/pricing">
                See pricing
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>

          <div className="flex flex-col items-start gap-8 p-6 md:p-8">
            <SectionBody>
              <p>
                <span className="text-foreground">
                  Faster Fixes is open source:
                </span>{" "}
                the app is AGPL-3.0 and the widget packages are MIT, so you can
                self-host it. A self-hosted install resolves to the Agency plan.
              </p>
            </SectionBody>

            <Button asChild variant="outline" className="mt-auto">
              <Link href={"/open-source" as Route}>
                Self-host it
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
