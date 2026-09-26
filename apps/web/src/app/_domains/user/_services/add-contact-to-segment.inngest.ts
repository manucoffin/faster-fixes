import { mailer } from "@/lib/mailer/client";
import { inngest } from "@/server/inngest";
import { userEmailVerifiedEvent } from "@/server/inngest/events";
import { prisma } from "@workspace/db";

export const addContactToSegment = inngest.createFunction(
  {
    id: "add-contact-to-segment",
    retries: 3,
    // A re-emit of the same verification must not re-run the provider calls.
    idempotency: "event.data.userId",
    // Verified addresses only, so the segment never accumulates unconfirmed
    // sign-ups. Idempotency is per-function, so this shares the trigger with
    // send-welcome-email without either suppressing the other.
    triggers: [{ event: userEmailVerifiedEvent }],
  },
  async ({ event }) => {
    const { userId } = event.data;

    // Self-hosted instances have no marketing segment configured.
    const segmentId = process.env.RESEND_SEGMENT_ID;
    if (!segmentId) return { skipped: "no_segment_configured" };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) return { skipped: "user_not_found" };

    const email = user.email.toLowerCase().trim();

    try {
      await mailer.contacts.create({ email, subscribed: true });
    } catch (error) {
      // The contact may already exist (earlier newsletter signup, or a
      // re-registration after account deletion). The segment add below is the
      // operation that must succeed, so a failed create is not fatal here.
      console.warn(
        `[add-contact-to-segment] contact create failed userId=${userId}`,
        error,
      );
    }

    await mailer.contacts.addToSegment({ email, segmentId });

    return { userId };
  },
);
