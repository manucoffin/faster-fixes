import {
  getEngagedOrganizationWhere,
  internalMemberWhere,
} from "@/app/_domains/organization";
import { prisma } from "@workspace/db";

import {
  TESTIMONIAL_ENGAGED_WINDOW_DAYS,
  TESTIMONIAL_MIN_ORGANIZATION_AGE_DAYS,
  type TestimonialCandidate,
} from "../_helpers/select-testimonial-recipients";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Loads the Organizations the Testimonial request scan may consider, shaped
 * for `selectTestimonialRecipients`, which owns every eligibility rule. The
 * where clause only narrows the rows to read.
 */
export async function listTestimonialCandidates(
  now: Date,
): Promise<TestimonialCandidate[]> {
  const organizations = await prisma.organization.findMany({
    where: {
      testimonialRequest: { is: null },
      createdAt: {
        lte: new Date(
          now.getTime() - TESTIMONIAL_MIN_ORGANIZATION_AGE_DAYS * DAY_MS,
        ),
      },
      ...getEngagedOrganizationWhere(
        new Date(now.getTime() - TESTIMONIAL_ENGAGED_WINDOW_DAYS * DAY_MS),
        now,
      ),
    },
    select: {
      id: true,
      createdAt: true,
      _count: { select: { members: { where: internalMemberWhere } } },
      projects: {
        select: {
          _count: { select: { feedback: true } },
          feedback: {
            select: { createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
      members: {
        where: { role: "owner" },
        select: {
          role: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              banned: true,
              emailVerified: true,
              testimonialRequest: { select: { id: true } },
            },
          },
        },
      },
    },
  });

  return organizations.map((organization) => {
    const lastFeedbackTimes = organization.projects.flatMap((project) =>
      project.feedback.map((feedback) => feedback.createdAt.getTime()),
    );

    return {
      organizationId: organization.id,
      createdAt: organization.createdAt,
      isInternal: organization._count.members > 0,
      // The where clause above already excludes Organizations with a request.
      hasTestimonialRequest: false,
      feedbackCount: organization.projects.reduce(
        (total, project) => total + project._count.feedback,
        0,
      ),
      lastFeedbackAt:
        lastFeedbackTimes.length > 0
          ? new Date(Math.max(...lastFeedbackTimes))
          : null,
      members: organization.members.map((member) => ({
        userId: member.user.id,
        role: member.role,
        memberSince: member.createdAt,
        banned: member.user.banned === true,
        emailVerified: member.user.emailVerified,
        hasTestimonialRequest: member.user.testimonialRequest !== null,
      })),
    };
  });
}

export type ListTestimonialCandidatesOutput = Awaited<
  ReturnType<typeof listTestimonialCandidates>
>;
