import { Button } from "@workspace/ui/components/button";
import type { Route } from "next";
import Link from "next/link";
import {
  AnnotateContent,
  BeamConnector,
  FixContent,
  flowAnimationStyles,
  StructureContent,
  TerminalFrame,
} from "./flow-animations";

const steps = [
  {
    label: "// 01",
    cardTitle: "yourapp.com",
    title: "Client annotate your site",
    description:
      "No account, no onboarding. They click, leave a comment, and move on. Screenshot, URL, component path, and browser details are captured automatically.",
    Content: AnnotateContent,
  },
  {
    label: "// 02",
    cardTitle: "feedback.md",
    title: "Output as structured markdown",
    description:
      "The widget structures every detail automatically. Your agent receives a complete report and knows exactly where to look.",
    Content: StructureContent,
  },
  {
    label: "// 03",
    cardTitle: "terminal",
    title: "Agent fixes it automatically",
    description:
      "Connect the MCP server once. Your agent fetches new feedback, locates the code, applies the fix, and marks it resolved. Fully unattended.",
    Content: FixContent,
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-muted/50 w-full py-16 md:py-24">
      <style dangerouslySetInnerHTML={{ __html: flowAnimationStyles }} />
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

        <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step, i) => (
            <div key={step.label} className="relative flex flex-col gap-4">
              <TerminalFrame title={step.cardTitle}>
                <step.Content />
              </TerminalFrame>

              {/* Beam connector bridging the grid gap to the next column */}
              {i < steps.length - 1 && (
                <div className="absolute top-20 right-0 hidden w-8 translate-x-full md:block">
                  <BeamConnector />
                </div>
              )}

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
