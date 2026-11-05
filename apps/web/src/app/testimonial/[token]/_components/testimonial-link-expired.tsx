import { PublicMessage } from "@/app/_components/public-message";

export function TestimonialLinkExpired() {
  return (
    <PublicMessage
      title="This link no longer works"
      description="It has expired or has already been used. If you would still like to share your experience, reply to the email you received."
    />
  );
}
