import { prisma } from "@workspace/db";

import { generateTestimonialRequestToken } from "../_helpers/generate-testimonial-request-token";
import type { selectTestimonialRecipients } from "../_helpers/select-testimonial-recipients";
import { TestimonialRequestStatusEnum } from "../_helpers/testimonial-request-status";

type CreateTestimonialRequestsParams = ReturnType<
  typeof selectTestimonialRecipients
> & { now: Date };

/**
 * Records the scan's decisions: a `pending` request per recipient and an
 * `expired` request with no User per handled Organization, so neither is
 * reconsidered. Returns only the `pending` rows this call inserted: a row
 * that already exists for the Organization (or the User) is skipped, which
 * makes a replayed scan create and announce nothing twice.
 */
export async function createTestimonialRequests({
  recipients,
  handled,
  now,
}: CreateTestimonialRequestsParams) {
  if (handled.length > 0) {
    await prisma.testimonialRequest.createMany({
      data: handled.map((organization) => ({
        organizationId: organization.organizationId,
        feedbackCount: organization.feedbackCount,
        token: generateTestimonialRequestToken(),
        status: TestimonialRequestStatusEnum.enum.expired,
        closedAt: now,
      })),
      skipDuplicates: true,
    });
  }

  if (recipients.length === 0) return [];

  return prisma.testimonialRequest.createManyAndReturn({
    data: recipients.map((recipient) => ({
      organizationId: recipient.organizationId,
      userId: recipient.userId,
      feedbackCount: recipient.feedbackCount,
      token: generateTestimonialRequestToken(),
      status: TestimonialRequestStatusEnum.enum.pending,
    })),
    select: { id: true, organizationId: true },
    skipDuplicates: true,
  });
}
