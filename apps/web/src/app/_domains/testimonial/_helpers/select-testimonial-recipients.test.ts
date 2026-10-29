import { describe, expect, it } from "vitest";
import {
  selectTestimonialRecipients,
  type TestimonialCandidate,
  type TestimonialCandidateMember,
} from "./select-testimonial-recipients";

const now = new Date("2026-10-29T08:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number) {
  return new Date(now.getTime() - days * DAY_MS);
}

function member(
  fields: Partial<TestimonialCandidateMember> = {},
): TestimonialCandidateMember {
  return {
    userId: "user_1",
    role: "owner",
    memberSince: daysAgo(60),
    banned: false,
    emailVerified: true,
    hasTestimonialRequest: false,
    ...fields,
  };
}

function candidate(
  fields: Partial<TestimonialCandidate> = {},
): TestimonialCandidate {
  const organizationId = fields.organizationId ?? "org_1";
  return {
    organizationId,
    createdAt: daysAgo(60),
    isInternal: false,
    hasTestimonialRequest: false,
    feedbackCount: 12,
    lastFeedbackAt: daysAgo(2),
    members: [member({ userId: `${organizationId}_owner` })],
    ...fields,
  };
}

describe("selectTestimonialRecipients", () => {
  it("selects the owner of an eligible Organization with its Feedback count", () => {
    const result = selectTestimonialRecipients([candidate()], now);

    expect(result).toEqual({
      recipients: [
        { organizationId: "org_1", userId: "org_1_owner", feedbackCount: 12 },
      ],
      handled: [],
    });
  });

  it("returns nothing for no candidates", () => {
    expect(selectTestimonialRecipients([], now)).toEqual({
      recipients: [],
      handled: [],
    });
  });

  describe("Feedback threshold", () => {
    it("accepts exactly 10 Feedback", () => {
      const result = selectTestimonialRecipients(
        [candidate({ feedbackCount: 10 })],
        now,
      );
      expect(result.recipients).toHaveLength(1);
    });

    it("skips an Organization with 9 Feedback without marking it handled", () => {
      const result = selectTestimonialRecipients(
        [candidate({ feedbackCount: 9 })],
        now,
      );
      expect(result).toEqual({ recipients: [], handled: [] });
    });
  });

  describe("Engaged organization rule", () => {
    it("accepts a last Feedback exactly 30 days ago", () => {
      const result = selectTestimonialRecipients(
        [candidate({ lastFeedbackAt: daysAgo(30) })],
        now,
      );
      expect(result.recipients).toHaveLength(1);
    });

    it("skips an Organization whose last Feedback is older than 30 days", () => {
      const result = selectTestimonialRecipients(
        [candidate({ lastFeedbackAt: daysAgo(31) })],
        now,
      );
      expect(result).toEqual({ recipients: [], handled: [] });
    });

    it("skips an Organization with no Feedback date", () => {
      const result = selectTestimonialRecipients(
        [candidate({ lastFeedbackAt: null })],
        now,
      );
      expect(result.recipients).toEqual([]);
    });
  });

  describe("age rule", () => {
    it("accepts an Organization created exactly 14 days ago", () => {
      const result = selectTestimonialRecipients(
        [candidate({ createdAt: daysAgo(14) })],
        now,
      );
      expect(result.recipients).toHaveLength(1);
    });

    it("skips an Organization created 13 days ago", () => {
      const result = selectTestimonialRecipients(
        [candidate({ createdAt: daysAgo(13) })],
        now,
      );
      expect(result).toEqual({ recipients: [], handled: [] });
    });
  });

  it("skips an internal Organization", () => {
    const result = selectTestimonialRecipients(
      [candidate({ isInternal: true })],
      now,
    );
    expect(result).toEqual({ recipients: [], handled: [] });
  });

  it("skips an Organization that already has a Testimonial request", () => {
    const result = selectTestimonialRecipients(
      [candidate({ hasTestimonialRequest: true })],
      now,
    );
    expect(result).toEqual({ recipients: [], handled: [] });
  });

  describe("owner choice", () => {
    it("picks the owner with the oldest membership, ignoring older non-owners", () => {
      const result = selectTestimonialRecipients(
        [
          candidate({
            members: [
              member({ userId: "new_owner", memberSince: daysAgo(20) }),
              member({
                userId: "old_admin",
                role: "admin",
                memberSince: daysAgo(90),
              }),
              member({ userId: "old_owner", memberSince: daysAgo(50) }),
            ],
          }),
        ],
        now,
      );

      expect(result.recipients.map((r) => r.userId)).toEqual(["old_owner"]);
    });

    it.each([
      ["banned", { banned: true }],
      ["unverified", { emailVerified: false }],
      ["already asked", { hasTestimonialRequest: true }],
    ])("passes over a %s owner for the next oldest", (_label, fields) => {
      const result = selectTestimonialRecipients(
        [
          candidate({
            members: [
              member({ userId: "oldest", memberSince: daysAgo(90), ...fields }),
              member({ userId: "next", memberSince: daysAgo(40) }),
            ],
          }),
        ],
        now,
      );

      expect(result.recipients.map((r) => r.userId)).toEqual(["next"]);
    });

    it("asks a User once across Organizations in the same run", () => {
      const shared = member({ userId: "shared", memberSince: daysAgo(90) });
      const result = selectTestimonialRecipients(
        [
          candidate({
            organizationId: "org_a",
            createdAt: daysAgo(100),
            members: [shared],
          }),
          candidate({
            organizationId: "org_b",
            createdAt: daysAgo(80),
            members: [
              shared,
              member({ userId: "other", memberSince: daysAgo(30) }),
            ],
          }),
          candidate({
            organizationId: "org_c",
            createdAt: daysAgo(70),
            members: [shared],
          }),
        ],
        now,
      );

      expect(result.recipients).toEqual([
        { organizationId: "org_a", userId: "shared", feedbackCount: 12 },
        { organizationId: "org_b", userId: "other", feedbackCount: 12 },
      ]);
      expect(result.handled).toEqual([
        { organizationId: "org_c", feedbackCount: 12 },
      ]);
    });
  });

  describe("mark as handled", () => {
    it("marks an eligible Organization with no eligible owner as handled", () => {
      const result = selectTestimonialRecipients(
        [
          candidate({
            feedbackCount: 15,
            members: [
              member({ userId: "banned", banned: true }),
              member({ userId: "admin", role: "admin" }),
            ],
          }),
        ],
        now,
      );

      expect(result).toEqual({
        recipients: [],
        handled: [{ organizationId: "org_1", feedbackCount: 15 }],
      });
    });

    it("marks an eligible Organization with no Member as handled", () => {
      const result = selectTestimonialRecipients(
        [candidate({ members: [] })],
        now,
      );
      expect(result.handled).toEqual([
        { organizationId: "org_1", feedbackCount: 12 },
      ]);
    });
  });

  describe("ordering and cap", () => {
    it("orders recipients by Organization creation date ascending", () => {
      const result = selectTestimonialRecipients(
        [
          candidate({ organizationId: "young", createdAt: daysAgo(20) }),
          candidate({ organizationId: "old", createdAt: daysAgo(200) }),
          candidate({ organizationId: "middle", createdAt: daysAgo(50) }),
        ],
        now,
      );

      expect(result.recipients.map((r) => r.organizationId)).toEqual([
        "old",
        "middle",
        "young",
      ]);
    });

    it("selects at most 10 recipients, the oldest Organizations first", () => {
      const candidates = Array.from({ length: 12 }, (_, index) =>
        candidate({
          organizationId: `org_${index}`,
          createdAt: daysAgo(100 - index),
        }),
      );

      const result = selectTestimonialRecipients(candidates.reverse(), now);

      expect(result.recipients.map((r) => r.organizationId)).toEqual(
        Array.from({ length: 10 }, (_, index) => `org_${index}`),
      );
    });

    it("does not count handled Organizations against the cap", () => {
      const handledOrganizations = Array.from({ length: 3 }, (_, index) =>
        candidate({
          organizationId: `handled_${index}`,
          createdAt: daysAgo(300 - index),
          members: [],
        }),
      );
      const askable = Array.from({ length: 10 }, (_, index) =>
        candidate({
          organizationId: `org_${index}`,
          createdAt: daysAgo(100 - index),
        }),
      );

      const result = selectTestimonialRecipients(
        [...askable, ...handledOrganizations],
        now,
      );

      expect(result.recipients).toHaveLength(10);
      expect(result.handled.map((h) => h.organizationId)).toEqual([
        "handled_0",
        "handled_1",
        "handled_2",
      ]);
    });
  });
});
