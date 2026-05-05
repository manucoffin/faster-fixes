import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

export const githubSetupSteps = [
  {
    label: "Install the GitHub App once",
    body: "Install the Faster Fixes GitHub App at the org level — it covers every repo in your organization from a single install.",
  },
  {
    label: "Link a repo to your project",
    body: "Pick a GitHub repo for each Faster Fixes project, toggle auto-create on or off, and set default labels to fit your existing workflow.",
  },
  {
    label: "Clients submit feedback, issues appear",
    body: "From that point on, every piece of client feedback submitted through the widget creates a GitHub issue in the linked repo, pre-loaded with full context.",
  },
];

export function GithubHowItWorksSection() {
  return (
    <section className="bg-muted/30 w-full border-y py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            How it works
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Set up in three steps
          </h2>
        </div>

        <ol className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
          {githubSetupSteps.map((step, i) => (
            <li
              key={step.label}
              className="bg-background flex gap-4 rounded-xl border p-6"
            >
              <span className="text-muted-foreground font-mono text-sm">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-semibold">{step.label}</h3>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex justify-center">
          <Button asChild size="lg">
            <Link href={"/docs/integrations/github" as Route}>
              Full setup guide
              <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
