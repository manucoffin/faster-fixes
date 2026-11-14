import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { SectionBody } from "../../_components/section-body";
import { SectionHeading } from "../../_components/section-heading";
import { InstallPanel } from "../../_components/install-panel.client";

export function ActionableBugReportsInstall() {
  return (
    <section className="w-full py-20 md:py-28">
      <div className="container mx-auto grid grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading>Install</SectionHeading>
          <SectionBody className="mt-6">
            <p>
              Packages cover React and Next.js, Vue and Nuxt, Angular, and
              Svelte and SvelteKit. One script tag covers WordPress, Webflow and
              static HTML. Snippets are provided for Astro, Solid, Preact and
              vanilla JavaScript.{" "}
              <span className="text-foreground">
                Every path mounts the same widget and captures the same context.
              </span>
            </p>
          </SectionBody>

          <Button asChild size="lg" className="mt-8">
            <Link href={"/docs/widget/overview" as Route}>
              Start with the widget overview
              <ArrowRightIcon />
            </Link>
          </Button>
        </div>

        <InstallPanel />
      </div>
    </section>
  );
}
