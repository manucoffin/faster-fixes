import { Button } from "@workspace/ui/components/button";
import type { Route } from "next";
import Link from "next/link";

const steps = [
  {
    label: "// 01",
    title: "Your client annotates any element",
    description:
      "No account, no onboarding. They click, leave a comment, and move on. Screenshot, URL, component path, and browser details are captured automatically.",
  },
  {
    label: "// 02",
    title: "Feedback is structured and agent-ready",
    description:
      "The widget structures every detail automatically. Your agent receives a complete report and knows exactly where to look.",
  },
  {
    label: "// 03",
    title: "Your agent pulls it and fixes it automatically",
    description:
      "Connect the MCP server once. Your agent fetches new feedback, locates the code, applies the fix, and marks it resolved. Fully unattended.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-muted/50 w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            How it works
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Client clicks. <br className="hidden sm:block" />
            Coding agent fixes. <br className="hidden sm:block" />
            You review.
          </h2>
        </div>

        {/* TODO: replace with actual product video */}
        <div className="bg-muted mx-auto mt-12 flex aspect-video max-w-4xl items-center justify-center rounded-xl border">
          <p className="text-muted-foreground text-sm">
            Product video placeholder
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.label} className="flex flex-col gap-3">
              <span className="text-muted-foreground font-mono text-sm">
                {step.label}
              </span>
              <h3 className="text-lg font-semibold md:text-xl">{step.title}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed md:text-xl">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button asChild variant="outline" size="lg">
            <Link href={"/docs" as Route}>Read the docs</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
