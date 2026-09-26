import type { Route } from "next";
import Link from "next/link";

type VsSlug =
  | "atarim"
  | "bugherd"
  | "gleap"
  | "marker-io"
  | "markup-io"
  | "ruttl"
  | "userback"
  | "usersnap";

const allComparisons: { slug: VsSlug; label: string; href: Route }[] = [
  {
    slug: "bugherd",
    label: "BugHerd alternative",
    href: "/vs/bugherd" as Route,
  },
  {
    slug: "marker-io",
    label: "Marker.io alternative",
    href: "/vs/marker-io" as Route,
  },
  {
    slug: "usersnap",
    label: "Usersnap alternative",
    href: "/vs/usersnap" as Route,
  },
  {
    slug: "userback",
    label: "Userback alternative",
    href: "/vs/userback" as Route,
  },
  { slug: "atarim", label: "Atarim alternative", href: "/vs/atarim" as Route },
  { slug: "gleap", label: "Gleap alternative", href: "/vs/gleap" as Route },
  { slug: "ruttl", label: "Ruttl alternative", href: "/vs/ruttl" as Route },
  {
    slug: "markup-io",
    label: "Markup.io alternative",
    href: "/vs/markup-io" as Route,
  },
];

type VsCrossLinksProps = {
  currentSlug: VsSlug;
};

export function VsCrossLinks({ currentSlug }: VsCrossLinksProps) {
  const others = allComparisons.filter((c) => c.slug !== currentSlug);

  return (
    <section className="w-full py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Compare other tools
          </p>
          <h2 className="text-2xl font-bold md:text-3xl">
            Also comparing FasterFixes to
          </h2>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-base">
            {others.map((item, i) => (
              <li key={item.slug} className="flex items-center gap-x-6">
                <Link
                  href={item.href}
                  className="text-foreground underline underline-offset-4 hover:no-underline"
                >
                  {item.label}
                </Link>
                {i < others.length - 1 && (
                  <span className="text-muted-foreground" aria-hidden>
                    ·
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
