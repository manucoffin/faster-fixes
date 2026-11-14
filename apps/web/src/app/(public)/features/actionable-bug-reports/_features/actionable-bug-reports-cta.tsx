import { signupUrl } from "@/app/_constants/routes";
import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { InstallPanel } from "../../_components/install-panel.client";
import { SectionBody } from "../../_components/section-body";
import { SectionHeading } from "../../_components/section-heading";

export function ActionableBugReportsCta() {
  return (
    <section className="w-full bg-muted/50 py-20 md:py-28">
      <div className="container mx-auto grid grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading className="md:text-5xl">
            Start collecting complete bug reports
          </SectionHeading>

          <SectionBody className="mt-6 max-w-xl">
            <p>
              Install the widget with one package or one script tag, then send
              your client a review link. The Free plan includes the full capture
              and has no time limit.
            </p>
          </SectionBody>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href={signupUrl}>
                Start on the Free plan
                <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={"/docs/widget/overview" as Route}>Read the docs</Link>
            </Button>
          </div>
        </div>

        <InstallPanel />
      </div>
    </section>
  );
}
