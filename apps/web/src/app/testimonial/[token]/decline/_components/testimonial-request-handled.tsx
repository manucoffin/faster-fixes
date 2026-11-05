import { PublicMessage } from "@/app/_components/public-message";

export function TestimonialRequestHandled() {
  return (
    <PublicMessage
      title="This request is already handled"
      description="There is nothing left to do. You will not receive further emails about it."
    />
  );
}
