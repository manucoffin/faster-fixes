"use client";

import { TestimonialLinkExpired } from "../_components/testimonial-link-expired";
import { TestimonialThankYou } from "../_components/testimonial-thank-you";
import { TestimonialForm } from "./testimonial-form.client";
import type { TestimonialPrefill } from "./use-submit-testimonial";
import { useSubmitTestimonial } from "./use-submit-testimonial";

type TestimonialSubmissionProps = {
  token: string;
  prefill: TestimonialPrefill;
};

export function TestimonialSubmission({
  token,
  prefill,
}: TestimonialSubmissionProps) {
  const { submitted, expired, ...formProps } = useSubmitTestimonial({
    token,
    prefill,
  });

  if (expired) return <TestimonialLinkExpired />;
  if (submitted) return <TestimonialThankYou testimonial={submitted} />;

  return (
    <div>
      {/* Each step asks its own question, so the page title is for screen
          readers only. */}
      <h1 className="sr-only">Share your experience</h1>
      <TestimonialForm token={token} prefill={prefill} {...formProps} />
    </div>
  );
}
