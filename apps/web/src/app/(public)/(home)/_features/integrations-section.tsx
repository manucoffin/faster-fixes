import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

type Integration = {
  label: string;
  href: Route;
  description: string;
};

const integrations: Integration[] = [
  {
    label: "GitHub integration",
    href: "/integrations/github" as Route,
    description:
      "Auto-create GitHub issues from feedback with screenshot, CSS selector, and React component path. Bidirectional status sync.",
  },
];

export function IntegrationsSection() {
  return (
    <section className="w-full border-t py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            Integrations
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Connects to the tools your team already uses
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Feedback flows into your project management workflow — no manual
            triage, no copy-pasting.
          </p>
        </div>

        <ul className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className="group block h-full">
                <Card className="hover:border-foreground bg-muted/30 h-full transition-colors">
                  <CardHeader>
                    <CardTitle className="text-base">{item.label}</CardTitle>
                    <CardDescription className="leading-relaxed">
                      {item.description}
                    </CardDescription>
                    <CardAction>
                      <ArrowRightIcon className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors" />
                    </CardAction>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
