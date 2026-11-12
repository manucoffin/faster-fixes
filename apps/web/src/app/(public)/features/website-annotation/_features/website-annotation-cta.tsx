import { signupUrl } from "@/app/_constants/routes";
import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { CopyCommand } from "../../../(home)/_features/copy-command.client";
import { SectionBody } from "../_components/section-body";
import { SectionHeading } from "../_components/section-heading";

export function WebsiteAnnotationCta() {
  return (
    <section className="w-full bg-muted/50 py-20 md:py-28">
      <div className="container mx-auto grid grid-cols-1 items-end gap-12 px-4 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading className="md:text-5xl">
            Start annotating your site this afternoon
          </SectionHeading>

          <CopyCommand command="npm install @fasterfixes/react" />

          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
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

        <SectionBody>
          <p>
            Nothing to migrate. Install <code>@fasterfixes/react</code> or drop
            the script tag into your layout, send one review link, take the
            first report, and check what your own pages leak: the masking
            attributes are markup, not a paid tier.
          </p>
          <p>
            The Free plan carries one project, twenty feedback items and the
            full capture, so a real page from a real client is enough to see the
            difference between a comment and a report. Self-hosting costs
            nothing under AGPL-3.0. See <Link href="/pricing">pricing</Link> for
            what Pro adds when your second project starts.
          </p>
        </SectionBody>
      </div>
    </section>
  );
}
