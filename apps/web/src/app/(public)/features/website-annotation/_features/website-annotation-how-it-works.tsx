import type { Route } from "next";
import Link from "next/link";
import { ReportAnatomyIllustration } from "../_components/illustrations/report-anatomy-illustration";
import { SectionBody } from "../_components/section-body";
import { SectionHeading } from "../_components/section-heading";

export function WebsiteAnnotationHowItWorks() {
  return (
    <section className="w-full py-20 md:py-28">
      <div className="container mx-auto px-4">
        <SectionHeading>
          Click an element, comment, no account: a feedback tool for websites
          your clients finish in two clicks
        </SectionHeading>

        <div className="mt-12 grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionBody>
            <p>
              A review does not need a canvas, a Chrome extension or a signup
              from your client. You create the project, generate the review
              link, and the widget only renders for reviewers who arrive through
              it: your public visitors never see a floating button, and your
              client just opens a URL. They click the misaligned card, the
              label, the dead button, type the comment, submit.
            </p>
            <p>
              <span className="text-foreground">
                That is why we built a website feedback tool rather than a
                markup layer. There is no PNG to export afterwards, because the
                page is the report.
              </span>{" "}
              Clients annotate website elements in place, and the capture
              documents the rest: page URL, CSS selector, click position and
              viewport, browser and OS, a screenshot at submission, console
              output and network requests from just before, plus the replay of
              the previous minute.
            </p>
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
