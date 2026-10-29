import { isTestimonialRequestDeclinable } from "@/app/_domains/testimonial/_services/is-testimonial-request-declinable";
import { checkRateLimit } from "@/server/rate-limit/check-rate-limit";
import type { PageParams } from "@/types/next";
import type { Metadata } from "next";
import { TestimonialTooManyRequests } from "@/app/testimonial/_components/testimonial-too-many-requests";
import { TestimonialRequestHandled } from "./_components/testimonial-request-handled";
import { TestimonialDecline } from "./_features/testimonial-decline.client";

export const metadata: Metadata = {
  title: "Stop testimonial requests",
};

// Opening the page never changes the request: mail clients prefetch links, so only the
// confirmation click declines the request.
export default async function TestimonialDeclinePage({
  params,
}: PageParams<{ token: string }>) {
  const { token } = await params;

  const { allowed } = await checkRateLimit(token, "testimonial-token");
  if (!allowed) return <TestimonialTooManyRequests />;

  const declinable = await isTestimonialRequestDeclinable({
    token,
    now: new Date(),
  });

  if (!declinable) return <TestimonialRequestHandled />;

  return <TestimonialDecline token={token} />;
}
