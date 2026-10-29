import { openTestimonialRequest } from "@/app/_domains/testimonial/_services/open-testimonial-request";
import type { PageParams } from "@/types/next";
import { TestimonialLinkExpired } from "./_components/testimonial-link-expired";
import { TestimonialSubmission } from "./_features/testimonial-submission.client";

export default async function TestimonialPage({
  params,
}: PageParams<{ token: string }>) {
  const { token } = await params;

  const request = await openTestimonialRequest({ token, now: new Date() });

  if (request.state === "expired") return <TestimonialLinkExpired />;

  return <TestimonialSubmission token={token} prefill={request.prefill} />;
}
