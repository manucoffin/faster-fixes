import { TestimonialMessage } from "@/app/testimonial/_components/testimonial-message";

export function TestimonialDeclined() {
  return (
    <TestimonialMessage
      title="You will not be asked again"
      description="No further testimonial requests will be sent to you."
    />
  );
}
