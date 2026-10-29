import { openTestimonialRequest } from "@/app/_domains/testimonial/_services/open-testimonial-request";
import type { PageParams } from "@/types/next";
import { TestimonialLinkExpired } from "./_components/testimonial-link-expired";
import { TestimonialForm } from "./_features/testimonial-form.client";

export default async function TestimonialPage({
  params,
}: PageParams<{ token: string }>) {
  const { token } = await params;

  const request = await openTestimonialRequest({ token, now: new Date() });

  if (request.state === "expired") return <TestimonialLinkExpired />;

  return (
    <div className="space-y-8 pt-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Share your experience</h1>
        <p className="text-muted-foreground">
          A rating and a few sentences. Your details are filled in from your
          account and can be changed before you submit.
        </p>
      </div>
      <TestimonialForm prefill={request.prefill} />
    </div>
  );
}
