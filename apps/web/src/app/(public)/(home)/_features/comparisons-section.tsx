import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

type Comparison = {
  label: string;
  href: Route;
  description: string;
};

const comparisons: Comparison[] = [
  {
    label: "BugHerd alternative",
    href: "/vs/bugherd" as Route,
    description: "Visual client QA with sticky-note pins on live sites.",
  },
  {
    label: "Marker.io alternative",
    href: "/vs/marker-io" as Route,
    description: "Bug reporting that pipes into Jira, Linear, and Asana.",
  },
  {
    label: "Usersnap alternative",
    href: "/vs/usersnap" as Route,
    description: "End-user feedback with NPS surveys and feature boards.",
  },
  {
    label: "Userback alternative",
    href: "/vs/userback" as Route,
    description: "Annotated video and session replay for product teams.",
  },
  {
    label: "Atarim alternative",
    href: "/vs/atarim" as Route,
    description: "Visual collaboration for WordPress agencies.",
  },
  {
    label: "Gleap alternative",
    href: "/vs/gleap" as Route,
    description: "All-in-one customer support platform with an AI chatbot.",
  },
  {
    label: "Ruttl alternative",
    href: "/vs/ruttl" as Route,
    description:
      "Per-seat visual feedback with a Chrome-extension requirement.",
  },
  {
    label: "Markup.io alternative",
    href: "/vs/markup-io" as Route,
    description:
      "Design review tool that hiked prices 172% and removed its free plan.",
  },
];

export function ComparisonsSection() {
  return (
    <section className="w-full border-t py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Comparisons
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Switching from another tool?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See how FasterFixes compares to the tools you might be using today.
          </p>
        </div>

        <ul className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {comparisons.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="group flex h-full flex-col rounded-xl border bg-muted/30 p-6 transition-colors hover:border-foreground"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-base font-semibold text-foreground">
                    {item.label}
                  </span>
                  <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
