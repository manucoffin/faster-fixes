import { PublicMessage } from "@/app/_components/public-message";

export function TestimonialTooManyRequests() {
  return (
    <PublicMessage
      title="Too many requests"
      description="This link has been opened too many times in the last hour. Try again later."
    />
  );
}
