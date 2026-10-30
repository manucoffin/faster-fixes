import { inngest } from "@/server/inngest";
import {
  testimonialRequestClosedEvent,
  testimonialRequestCreatedEvent,
} from "@/server/inngest/events";

import { sendTestimonialRequestEmail } from "./send-testimonial-request-email";

/**
 * The one place that owns the Testimonial request timing: the first email,
 * then a single reminder seven days later, so it lands on the same weekday
 * and hour. Submitting or declining emits `request.closed`, which cancels
 * the run during the sleep.
 */
export const sendTestimonialRequestSequence = inngest.createFunction(
  {
    id: "send-testimonial-request-sequence",
    retries: 3,
    // A replayed `request.created` must not start a second sequence.
    idempotency: "event.data.requestId",
    cancelOn: [
      { event: testimonialRequestClosedEvent, match: "data.requestId" },
    ],
    triggers: [{ event: testimonialRequestCreatedEvent }],
  },
  async ({ event, step, logger }) => {
    const { requestId } = event.data;

    const first = await step.run("send-first-email", () =>
      sendTestimonialRequestEmail({
        requestId,
        kind: "first",
        now: new Date(),
      }),
    );
    logger.info("Testimonial request first email", { requestId, ...first });
    if (!first.sent) return { requestId, stopped: first.reason };

    await step.sleep("wait-before-reminder", "7d");

    // The service reloads the request, so a submission or decline that the
    // cancellation missed still stops the reminder.
    const reminder = await step.run("send-reminder", () =>
      sendTestimonialRequestEmail({
        requestId,
        kind: "reminder",
        now: new Date(),
      }),
    );
    logger.info("Testimonial request reminder", { requestId, ...reminder });
    if (!reminder.sent) return { requestId, stopped: reminder.reason };

    return { requestId, organizationId: reminder.organizationId };
  },
);
