import { EyeOffIcon } from "lucide-react";
import { SectionBody } from "../../_components/section-body";
import { SectionHeading } from "../../_components/section-heading";
import { ReviewLinkToFeedbackAnimation } from "../_components/illustrations/review-link-to-feedback-animation";

export function ActionableBugReportsCreation() {
  return (
    <section className="w-full py-20 md:py-28">
      <div className="container mx-auto px-4">
        <SectionHeading>How a Feedback is created</SectionHeading>

        <div className="mt-12 grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionBody>
            <p>
              <span className="text-foreground">
                A Reviewer opens your site through a review link, clicks the
                element that looks wrong, types one sentence and submits.
              </span>{" "}
              There is no account to create and no browser extension to install.
            </p>

            <div className="flex gap-4 border-t pt-5 text-base">
              <EyeOffIcon
                aria-hidden
                className="mt-1 size-5 shrink-0 text-muted-foreground"
              />
              <p>
                The widget renders only for Reviewers who arrive through a
                review link. Public visitors never see it and are never
                recorded.
              </p>
            </div>
          </SectionBody>

          <ReviewLinkToFeedbackAnimation />
        </div>
      </div>
    </section>
  );
}
