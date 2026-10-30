import { describe, expect, it, vi } from "vitest";

import { getTestimonialFunnel } from "./get-testimonial-funnel";

type FakeDb = NonNullable<Parameters<typeof getTestimonialFunnel>[1]>;

const now = new Date("2026-10-29T08:00:00Z");
const firstEmailSentAt = new Date("2026-10-01T08:00:00Z");

type RequestRow = {
  userId: string | null;
  status: string;
  firstEmailSentAt: Date | null;
  reminderSentAt: Date | null;
  expiresAt: Date | null;
};

function aRequest(overrides: Partial<RequestRow> = {}): RequestRow {
  return {
    userId: "user_1",
    status: "pending",
    firstEmailSentAt,
    reminderSentAt: null,
    expiresAt: new Date("2026-10-31T08:00:00Z"),
    ...overrides,
  };
}

function fakeDb(rows: RequestRow[]) {
  return {
    testimonialRequest: { findMany: vi.fn().mockResolvedValue(rows) },
  } as unknown as FakeDb;
}

const reminded = new Date("2026-10-08T08:00:00Z");

describe("getTestimonialFunnel", () => {
  it("counts each stage of the funnel", async () => {
    const funnel = await getTestimonialFunnel(
      { now },
      fakeDb([
        aRequest(),
        aRequest({ reminderSentAt: reminded }),
        aRequest({ status: "submitted" }),
        aRequest({ status: "submitted", reminderSentAt: reminded }),
        aRequest({ status: "declined" }),
        aRequest({ status: "expired", reminderSentAt: reminded }),
      ]),
    );

    expect(funnel).toEqual({
      requestsSent: 6,
      remindersSent: 3,
      submitted: 2,
      declined: 1,
      expired: 1,
    });
  });

  it("ignores Organizations marked as handled, which have no User", async () => {
    const funnel = await getTestimonialFunnel(
      { now },
      fakeDb([
        aRequest({ status: "submitted" }),
        aRequest({
          userId: null,
          status: "expired",
          firstEmailSentAt: null,
          expiresAt: null,
        }),
      ]),
    );

    expect(funnel).toEqual({
      requestsSent: 1,
      remindersSent: 0,
      submitted: 1,
      declined: 0,
      expired: 0,
    });
  });

  it("counts a pending request past its expiry date as expired", async () => {
    const funnel = await getTestimonialFunnel(
      { now },
      fakeDb([
        aRequest({
          reminderSentAt: reminded,
          expiresAt: new Date("2026-10-28T08:00:00Z"),
        }),
      ]),
    );

    expect(funnel.expired).toBe(1);
  });

  it("does not count a request whose first email is not sent yet", async () => {
    const funnel = await getTestimonialFunnel(
      { now },
      fakeDb([aRequest({ firstEmailSentAt: null, expiresAt: null })]),
    );

    expect(funnel).toEqual({
      requestsSent: 0,
      remindersSent: 0,
      submitted: 0,
      declined: 0,
      expired: 0,
    });
  });
});
