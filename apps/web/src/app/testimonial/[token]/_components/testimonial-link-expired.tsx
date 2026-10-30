import { TestimonialMessage } from "@/app/testimonial/_components/testimonial-message";

export function TestimonialLinkExpired() {
  return (
    <TestimonialMessage
      title="This link no longer works"
      description="It has expired or has already been used. If you would still like to share your experience, reply to the email you received."
    />
  );
}
