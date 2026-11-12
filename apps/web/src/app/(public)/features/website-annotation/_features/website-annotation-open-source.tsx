import type { Route } from "next";
import Link from "next/link";
import { LicenceBoundaryIllustration } from "../_components/illustrations/licence-boundary-illustration";
import { SectionBody } from "../_components/section-body";
import { SectionHeading } from "../_components/section-heading";

const managedHostParts = [
  "A Next.js deployment",
  "Postgres 14+",
  "An Inngest app",
  "A bucket or local disk",
  "An email provider",
];

export function WebsiteAnnotationOpenSource() {
  return (
    <section className="w-full py-20 md:py-28">
      <div className="container mx-auto px-4">
        <SectionHeading>
          Open source and self-hostable: the widget, the API and the MCP server
          on your own infrastructure
        </SectionHeading>

        <div className="mt-12 grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="rounded-2xl bg-muted/50 p-4 sm:p-8 lg:order-first">
            <LicenceBoundaryIllustration />
          </div>

          <SectionBody>
            <p>
              The app (dashboard, widget API and agent API) is AGPL-3.0, and the
              widget your clients load runs on MIT packages:{" "}
              <code>@fasterfixes/widget</code>, <code>@fasterfixes/core</code>,{" "}
              <code>@fasterfixes/react</code>, <code>@fasterfixes/vue</code>,{" "}
              <code>@fasterfixes/angular</code>,{" "}
              <code>@fasterfixes/svelte</code>, plus the MCP server.
            </p>
            <p>
              <span className="text-foreground">
                Embedding those carries no AGPL obligation, so the licence
                covers the service you run, not the sites you deliver.
              </span>
            </p>
          </SectionBody>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:mt-20 md:grid-cols-2">
          <div className="flex flex-col rounded-2xl border p-6 md:p-8">
            <h3 className="font-medium">On one machine</h3>
            <pre className="mt-4 overflow-x-auto rounded-lg bg-muted px-4 py-3 font-mono text-sm">
              <code>
                <span className="text-muted-foreground select-none">$ </span>
                docker compose up
              </code>
            </pre>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Starts the app, PostgreSQL and a self-hosted Inngest server with
              files on local disk.
            </p>
          </div>

          <div className="flex flex-col rounded-2xl border p-6 md:p-8">
            <h3 className="font-medium">On a managed host</h3>
            <ul className="mt-4 flex flex-col divide-y border-y">
              {managedHostParts.map((part) => (
                <li key={part} className="py-2.5 text-muted-foreground">
                  {part}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionBody>
            <p>
              Recording is included, needs no extra service, keeps the same 4 MB
              cap and is stored with your screenshots. Billing stays out: Stripe
              only runs on the hosted version.{" "}
              <span className="text-foreground">
                A self-hosted instance resolves to the Agency plan: unlimited
                projects, feedback and members, white-label widget and every
                integration.
              </span>
            </p>
          </SectionBody>
          <SectionBody>
            <p>
              Start with the{" "}
              <Link href={"/docs/self-hosting" as Route}>
                self-hosting guide
              </Link>{" "}
              and the <Link href="/open-source">open-source page</Link>. If you
              are mid-migration, the{" "}
              <Link href={"/vs/bugherd" as Route}>BugHerd</Link> and{" "}
              <Link href={"/vs/marker-io" as Route}>Marker.io</Link> comparisons
              line up licence, plan and per-seat cost.
            </p>
          </SectionBody>
        </div>
      </div>
    </section>
  );
}
