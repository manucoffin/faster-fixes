import { openTestimonialRequest } from "@/app/_domains/testimonial/_services/open-testimonial-request";
import { checkRateLimit } from "@/server/rate-limit/check-rate-limit";
import type { PageParams } from "@/types/next";
import { TestimonialTooManyRequests } from "@/app/testimonial/_components/testimonial-too-many-requests";
import { TestimonialLinkExpired } from "./_components/testimonial-link-expired";
import { TestimonialSubmission } from "./_features/testimonial-submission.client";

export default async function TestimonialPage({
  params,
}: PageParams<{ token: string }>) {
  const { token } = await params;

  // Shares the token bucket with the submit procedure and the photo upload.
  const { allowed } = await checkRateLimit(token, "testimonial-token");
  if (!allowed) return <TestimonialTooManyRequests />;

  const request = await openTestimonialRequest({ token, now: new Date() });

  if (request.state === "expired") return <TestimonialLinkExpired />;

  return <TestimonialSubmission token={token} prefill={request.prefill} />;
}
