import { TestimonialRequestStatusEnum } from "./testimonial-request-status";

type TestimonialRequestState = "open" | "lapsed" | "closed";

/**
 * Whether the request token may still open the form. `lapsed` is a `pending`
 * request past its expiry date that the daily cron has not closed yet: it is
 * refused like a closed one, and the caller persists the expiry.
 */
export function getTestimonialRequestState(
  request: { status: string; expiresAt: Date | null },
  now: Date,
): TestimonialRequestState {
  if (request.status !== TestimonialRequestStatusEnum.enum.pending) {
    return "closed";
  }
  // No expiry date until the first email is sent, so the request is open.
  if (request.expiresAt && request.expiresAt <= now) return "lapsed";
  return "open";
}
