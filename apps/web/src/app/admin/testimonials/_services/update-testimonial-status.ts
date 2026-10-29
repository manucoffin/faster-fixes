import { TestimonialStatusEnum } from "@/app/_domains/testimonial/_helpers/testimonial-status";
import { ConflictError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { z } from "zod";
import type { UpdateTestimonialStatusInput } from "./update-testimonial-status.schema";

type TestimonialStatus = z.infer<typeof TestimonialStatusEnum>;

// A rejected Testimonial is final; a published one only goes back to review.
const ALLOWED_TRANSITIONS: Record<TestimonialStatus, TestimonialStatus[]> = {
  pending: ["published", "rejected"],
  published: ["pending"],
  rejected: [],
};

export async function updateTestimonialStatus(
  { testimonialId, status, now }: UpdateTestimonialStatusInput & { now: Date },
  db: typeof prisma = prisma,
) {
  const testimonial = await db.testimonial.findUnique({
    where: { id: testimonialId },
    select: { status: true },
  });

  if (!testimonial) {
    throw new NotFoundError("Testimonial not found");
  }

  const current = TestimonialStatusEnum.parse(testimonial.status);

  if (!ALLOWED_TRANSITIONS[current].includes(status)) {
    throw new ConflictError(
      `A ${current} Testimonial cannot be moved to ${status}.`,
    );
  }

  return db.testimonial.update({
    where: { id: testimonialId },
    data: { status, statusChangedAt: now },
    select: { id: true, status: true, statusChangedAt: true },
  });
}

export type UpdateTestimonialStatusOutput = Awaited<
  ReturnType<typeof updateTestimonialStatus>
>;
