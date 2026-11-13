import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { LicenceBoundaryIllustration } from "../_components/illustrations/licence-boundary-illustration";
import { SectionBody } from "../_components/section-body";
import { SectionHeading } from "../_components/section-heading";

export function WebsiteAnnotationOpenSource() {
  return (
    <section className="w-full py-20 md:py-28">
      <div className="container mx-auto px-4">
        <SectionHeading>
          Self-host the widget, the API and the MCP server
        </SectionHeading>

        {/* One panel: two routes in, one shared outcome below them. */}
        <div className="mt-12 overflow-hidden rounded-2xl border">
          <div className="grid grid-cols-1 divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="flex flex-col p-6 md:p-8">
              <h3 className="text-lg font-medium">On your own server</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                A VPS or any machine with Docker. One command starts everything.
              </p>
              <pre className="mt-6 overflow-x-auto rounded-lg bg-muted px-4 py-3 font-mono text-sm">
                <code>
                  <span className="text-muted-foreground select-none">$ </span>
                  docker compose up
                </code>
              </pre>
            </div>

            <div className="flex flex-col p-6 md:p-8">
              <h3 className="text-lg font-medium">On a managed host</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                Deploy the Next.js app where you already host, then connect
                Postgres, Inngest, storage and an email provider.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-6 border-t bg-muted/50 p-6 md:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
            <SectionBody className="max-w-2xl">
              <p>
                <span className="text-foreground">
                  Either way, you get everything the paid plans include, with no
                  restriction:
                </span>{" "}
                unlimited projects, feedback and members, a white-label widget
                and every integration.
              </p>
            </SectionBody>

            <Button asChild size="lg" className="shrink-0">
              <Link href={"/docs/self-hosting" as Route}>
                Read the self-hosting guide
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 items-center gap-12 md:mt-20 lg:grid-cols-2 lg:gap-16">
          <div>
            <h3 className="text-xl font-medium tracking-tight">
              AGPL for the app, MIT for the widget
            </h3>
            <SectionBody className="mt-4">
              <p>
                The app (dashboard, widget API and agent API) is AGPL-3.0, and
                the widget your clients load runs on MIT packages:{" "}
                <code>@fasterfixes/widget</code> and the framework packages,
                plus the MCP server.
              </p>
              <p>
                <span className="text-foreground">
                  Embedding those carries no AGPL obligation, so the licence
                  covers the service you run, not the sites you deliver.
                </span>
              </p>
            </SectionBody>
          </div>

          <div className="rounded-2xl bg-muted/50 p-4 sm:p-8 lg:order-first">
            <LicenceBoundaryIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}
