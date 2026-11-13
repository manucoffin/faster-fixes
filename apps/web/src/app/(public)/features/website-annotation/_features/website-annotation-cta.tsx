import { signupUrl } from "@/app/_constants/routes";
import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { SectionBody } from "../_components/section-body";
import { SectionHeading } from "../_components/section-heading";
import { InstallPanel } from "./install-panel.client";

export function WebsiteAnnotationCta() {
  return (
    <section className="w-full bg-muted/50 py-20 md:py-28">
      <div className="container mx-auto grid grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading className="md:text-5xl">
            Start annotating your website today
          </SectionHeading>

          <SectionBody className="mt-6 max-w-xl">
            <p>
              Add the widget with the package for your framework, or one script
              tag on any other site, then send one review link. The Free plan
              includes the full capture, so one real page from one real client
              shows the difference between a comment and a report.
            </p>
          </SectionBody>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href={signupUrl}>
                Get Started Free
                <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
        </div>

        <InstallPanel />
      </div>
    </section>
  );
}
