import { TestimonialMessage } from "@/app/testimonial/_components/testimonial-message";

export function TestimonialRequestHandled() {
  return (
    <TestimonialMessage
      title="This request is already handled"
      description="There is nothing left to do. You will not receive further emails about it."
    />
  );
}
