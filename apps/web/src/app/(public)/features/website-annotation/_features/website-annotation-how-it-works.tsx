import type { Route } from "next";
import Link from "next/link";
import { ReportAnatomyIllustration } from "../_components/illustrations/report-anatomy-illustration";
import { SectionBody } from "../_components/section-body";
import { SectionHeading } from "../_components/section-heading";

const steps = [
  {
    title: "Send a review link.",
    body: "Install the widget, then generate a review link from your project. The widget only renders for reviewers who arrive through it, so your public visitors never see it.",
  },
  {
    title: "Your client clicks and comments.",
    body: "They click the misaligned card, the label, the dead button, type one sentence and submit. No canvas, no Chrome extension, no account.",
  },
  {
    title: "You get a complete report.",
    body: "Page URL, CSS selector, click position and viewport, browser and OS, a screenshot, console output and network requests, plus a replay of the previous minute.",
  },
];

export function WebsiteAnnotationHowItWorks() {
  return (
    <section className="w-full py-20 md:py-28">
      <div className="container mx-auto px-4">
        <SectionHeading>
          How to annotate a website in three steps
        </SectionHeading>

        <div className="mt-12 grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionBody>
            <ol className="flex flex-col gap-6">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span
                    aria-hidden
                    className="flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-sm text-foreground"
                  >
                    {index + 1}
                  </span>
                  <p>
                    <span className="text-foreground">{step.title}</span>{" "}
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
            <p className="border-t pt-5 text-base">
              Every install path mounts the same widget: the{" "}
              <Link href={"/docs/widget/overview" as Route}>
                widget overview
              </Link>{" "}
              lists them all, and the{" "}
              <Link href={"/docs/widget/install/script-embed" as Route}>
                script embed
              </Link>{" "}
              covers WordPress, Webflow and static HTML.
            </p>
          </SectionBody>

          <div className="rounded-2xl bg-muted/50 p-4 sm:p-8 lg:sticky lg:top-24">
            <ReportAnatomyIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}
