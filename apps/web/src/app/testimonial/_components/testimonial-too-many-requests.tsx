import { TestimonialMessage } from "@/app/testimonial/_components/testimonial-message";

export function TestimonialTooManyRequests() {
  return (
    <TestimonialMessage
      title="Too many requests"
      description="This link has been opened too many times in the last hour. Try again later."
    />
  );
}
