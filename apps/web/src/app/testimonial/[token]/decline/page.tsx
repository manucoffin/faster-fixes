import { isTestimonialRequestDeclinable } from "@/app/_domains/testimonial/_services/is-testimonial-request-declinable";
import type { PageParams } from "@/types/next";
import type { Metadata } from "next";
import { TestimonialRequestHandled } from "./_components/testimonial-request-handled";
import { TestimonialDecline } from "./_features/testimonial-decline.client";

export const metadata: Metadata = {
  title: "Stop testimonial requests",
};

// Opening the page writes nothing: mail clients prefetch links, so only the
// confirmation click declines the request.
export default async function TestimonialDeclinePage({
  params,
}: PageParams<{ token: string }>) {
  const { token } = await params;

  const declinable = await isTestimonialRequestDeclinable({
    token,
    now: new Date(),
  });

  if (!declinable) return <TestimonialRequestHandled />;

  return <TestimonialDecline token={token} />;
}
