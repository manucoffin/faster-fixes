import { HAS_COMMERCIAL_SENDER } from "@/lib/mailer/constants";
import { inngest } from "@/server/inngest";
import {
  buildEvent,
  testimonialRequestCreatedEvent,
} from "@/server/inngest/events";

import { selectTestimonialRecipients } from "../_helpers/select-testimonial-recipients";
import { createTestimonialRequests } from "./create-testimonial-requests";
import { listTestimonialCandidates } from "./list-testimonial-candidates";

/**
 * The only producer of Testimonial requests with a User. Weekday mornings so
 * the email lands when people read mail; the selection caps each run, so the
 * backlog of already-eligible Organizations spreads over the following days.
 */
export const scanTestimonialRequests = inngest.createFunction(
  {
    id: "scan-testimonial-requests",
    retries: 1,
    triggers: [{ cron: "TZ=UTC 0 8 * * 1-5" }],
  },
  async ({ step, logger }) => {
    // Self-hosted instances have no named sender and must never ask on the
    // operator's behalf.
    if (!HAS_COMMERCIAL_SENDER) return { skipped: "no_commercial_sender" };

    // One step reads the clock and selects, so a retry of a later step
    // replays the same decision instead of re-reading a moved clock.
    const selection = await step.run("select-recipients", async () => {
      const now = new Date();
      const candidates = await listTestimonialCandidates(now);
      return {
        now: now.toISOString(),
        ...selectTestimonialRecipients(candidates, now),
      };
    });

    const requests = await step.run("create-requests", () =>
      createTestimonialRequests({
        recipients: selection.recipients,
        handled: selection.handled,
        now: new Date(selection.now),
      }),
    );

    for (const request of requests) {
      logger.info("Testimonial request created", {
        requestId: request.id,
        organizationId: request.organizationId,
      });
    }

    if (requests.length > 0) {
      await step.sendEvent(
        "announce-requests",
        requests.map((request) => ({
          ...buildEvent(testimonialRequestCreatedEvent, {
            requestId: request.id,
          }),
          // One request per Organization, so the request id deduplicates the
          // announcement per Organization too.
          id: `testimonial-request-created-${request.id}`,
        })),
      );
    }

    return {
      created: requests.length,
      handled: selection.handled.length,
    };
  },
);
