import type { Route } from "next";
import Link from "next/link";

const comparisons: { label: string; href: Route }[] = [
  { label: "FasterFixes vs BugHerd", href: "/vs/bugherd" as Route },
  { label: "FasterFixes vs Marker.io", href: "/vs/marker-io" as Route },
];

export function UsersnapRelatedComparisons() {
  return (
    <section className="bg-muted/30 w-full border-y py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            Compare more tools
          </p>
          <h2 className="text-2xl font-bold md:text-3xl">
            Other feedback widget comparisons
          </h2>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {comparisons.map((c) => (
              <li key={c.href}>
                <Link
                  href={c.href}
                  className="text-foreground underline underline-offset-4 hover:no-underline"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
