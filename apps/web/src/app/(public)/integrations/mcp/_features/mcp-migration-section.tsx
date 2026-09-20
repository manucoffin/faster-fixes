import type { Route } from "next";
import Link from "next/link";

const switchLinks: { label: string; href: Route }[] = [
  { label: "Switching from BugHerd", href: "/vs/bugherd" as Route },
  { label: "Switching from Usersnap", href: "/vs/usersnap" as Route },
  { label: "Switching from Marker.io", href: "/vs/marker-io" as Route },
  { label: "Switching from Userback", href: "/vs/userback" as Route },
];

export function McpMigrationSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Migration
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Moving off another tool?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Export your current tool&apos;s data as CSV or JSON, parse it, and
            call <code>create_feedbacks</code> with up to 100 items per call.
            The batch is atomic and skips integration fan-out, no accidental
            issue spam in GitHub or Linear. Tag the source tool and attribute
            imports to a named reviewer so you know where each item came from.
          </p>
        </div>

        <ul className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          {switchLinks.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex items-center justify-between rounded-xl border bg-muted/30 p-4 transition-colors hover:border-foreground"
              >
                <span>{item.label}</span>
                <span className="text-muted-foreground transition-colors group-hover:text-foreground">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-8 max-w-2xl text-center text-muted-foreground">
          Import details are in the{" "}
          <Link
            href={"/docs/api-reference/agent-api" as Route}
            className="text-foreground underline underline-offset-4 hover:no-underline"
          >
            API reference
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
