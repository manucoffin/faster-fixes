import { signupUrl } from "@/app/_constants/routes";
import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { SectionBody } from "../../_components/section-body";
import { SectionHeading } from "../../_components/section-heading";

export function ActionableBugReportsCta() {
  return (
    <section className="w-full bg-muted/50 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <SectionHeading className="md:text-5xl">
          Start collecting complete bug reports
        </SectionHeading>

        <SectionBody className="mt-6 max-w-xl">
          <p>
            Send a client a review link and see what arrives. The Free plan
            covers one project and up to 20 feedback items, with no time limit.
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
            <Link href={"/docs/widget/overview" as Route}>
              Read the widget overview first
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
