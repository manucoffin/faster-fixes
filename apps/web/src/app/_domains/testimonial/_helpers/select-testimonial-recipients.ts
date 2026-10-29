const DAY_MS = 24 * 60 * 60 * 1000;

export const TESTIMONIAL_MIN_FEEDBACK_COUNT = 10;
// The Engaged organization window (CONTEXT.md).
export const TESTIMONIAL_ENGAGED_WINDOW_DAYS = 30;
export const TESTIMONIAL_MIN_ORGANIZATION_AGE_DAYS = 14;
export const TESTIMONIAL_RECIPIENTS_PER_RUN = 10;

export type TestimonialCandidateMember = {
  userId: string;
  role: string;
  memberSince: Date;
  banned: boolean;
  emailVerified: boolean;
  hasTestimonialRequest: boolean;
};

export type TestimonialCandidate = {
  organizationId: string;
  createdAt: Date;
  isInternal: boolean;
  hasTestimonialRequest: boolean;
  feedbackCount: number;
  lastFeedbackAt: Date | null;
  members: TestimonialCandidateMember[];
};

type TestimonialRecipient = {
  organizationId: string;
  userId: string;
  feedbackCount: number;
};

type HandledOrganization = {
  organizationId: string;
  feedbackCount: number;
};

function isEligibleOrganization(candidate: TestimonialCandidate, now: Date) {
  const engagedSince = new Date(
    now.getTime() - TESTIMONIAL_ENGAGED_WINDOW_DAYS * DAY_MS,
  );
  const createdBefore = new Date(
    now.getTime() - TESTIMONIAL_MIN_ORGANIZATION_AGE_DAYS * DAY_MS,
  );

  return (
    !candidate.isInternal &&
    !candidate.hasTestimonialRequest &&
    candidate.feedbackCount >= TESTIMONIAL_MIN_FEEDBACK_COUNT &&
    candidate.lastFeedbackAt !== null &&
    candidate.lastFeedbackAt >= engagedSince &&
    candidate.createdAt <= createdBefore
  );
}

/**
 * Picks who receives a Testimonial request this run: per eligible
 * Organization, the eligible owner with the oldest membership. An eligible
 * Organization without one is returned as handled so it is never reconsidered;
 * handled Organizations do not count against the cap.
 */
export function selectTestimonialRecipients(
  candidates: TestimonialCandidate[],
  now: Date,
) {
  const recipients: TestimonialRecipient[] = [];
  const handled: HandledOrganization[] = [];
  // A User is asked once in their life, so an owner picked for one
  // Organization in this run is no longer eligible for another.
  const askedUserIds = new Set<string>();

  const eligible = candidates
    .filter((candidate) => isEligibleOrganization(candidate, now))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  for (const candidate of eligible) {
    if (recipients.length >= TESTIMONIAL_RECIPIENTS_PER_RUN) break;

    const owner = candidate.members
      .filter(
        (member) =>
          member.role === "owner" &&
          !member.banned &&
          member.emailVerified &&
          !member.hasTestimonialRequest &&
          !askedUserIds.has(member.userId),
      )
      .sort((a, b) => a.memberSince.getTime() - b.memberSince.getTime())
      .at(0);

    if (!owner) {
      handled.push({
        organizationId: candidate.organizationId,
        feedbackCount: candidate.feedbackCount,
      });
      continue;
    }

    askedUserIds.add(owner.userId);
    recipients.push({
      organizationId: candidate.organizationId,
      userId: owner.userId,
      feedbackCount: candidate.feedbackCount,
    });
  }

  return { recipients, handled };
}
