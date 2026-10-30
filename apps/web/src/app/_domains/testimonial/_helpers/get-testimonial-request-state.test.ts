import { describe, expect, it } from "vitest";

import { getTestimonialRequestState } from "./get-testimonial-request-state";

const now = new Date("2026-10-29T08:00:00Z");

describe("getTestimonialRequestState", () => {
  it("is open for a pending request before its expiry date", () => {
    expect(
      getTestimonialRequestState(
        { status: "pending", expiresAt: new Date("2026-11-01T08:00:00Z") },
        now,
      ),
    ).toBe("open");
  });

  it("is open for a pending request whose first email is not sent yet", () => {
    expect(
      getTestimonialRequestState({ status: "pending", expiresAt: null }, now),
    ).toBe("open");
  });

  it("is lapsed for a pending request at or past its expiry date", () => {
    expect(
      getTestimonialRequestState({ status: "pending", expiresAt: now }, now),
    ).toBe("lapsed");
  });

  it.each(["submitted", "declined", "expired"])(
    "is closed for a %s request",
    (status) => {
      expect(
        getTestimonialRequestState(
          { status, expiresAt: new Date("2026-11-01T08:00:00Z") },
          now,
        ),
      ).toBe("closed");
    },
  );
});
