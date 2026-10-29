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
  const { form, onSubmit, isPending, submitted, expired } =
    useSubmitTestimonial({ token, prefill });

  if (expired) return <TestimonialLinkExpired />;
  if (submitted) return <TestimonialThankYou testimonial={submitted} />;

  return (
    <div className="space-y-8 pt-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Share your experience</h1>
        <p className="text-muted-foreground">
          A rating and a few sentences. Your details are filled in from your
          account and can be changed before you submit.
        </p>
      </div>
      <TestimonialForm
        form={form}
        onSubmit={onSubmit}
        isPending={isPending}
        prefill={prefill}
      />
    </div>
  );
}
