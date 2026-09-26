import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

export const slackSetupSteps = [
  {
    label: "Connect your workspace",
    body: "Install the Faster Fixes bot once via Slack OAuth. No webhooks to maintain, no Zapier in between. The install covers every project in your Faster Fixes organization.",
  },
  {
    label: "Pick a channel per project",
    body: "In project settings, choose the channel that should receive feedback. Public channels appear in a dropdown; private channels work once the bot is invited.",
  },
  {
    label: "Feedback starts posting",
    body: "Share the widget on your staging or production URL. Each new submission posts a message, and the team is notified when its status changes.",
  },
];

export function SlackHowItWorksSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            How it works
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Connect Slack in three steps
          </h2>
        </div>

        <ol className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
          {slackSetupSteps.map((step, i) => (
            <li
              key={step.label}
              className="flex gap-4 rounded-xl border bg-muted/30 p-6"
            >
              <span className="font-mono text-sm text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-semibold">{step.label}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex justify-center">
          <Button asChild size="lg">
            <Link href={"/docs/integrations/slack" as Route}>
              Full setup guide
              <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
