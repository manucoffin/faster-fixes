import { describe, expect, it, vi } from "vitest";

import { isTestimonialRequestDeclinable } from "./is-testimonial-request-declinable";

type FakeDb = NonNullable<Parameters<typeof isTestimonialRequestDeclinable>[1]>;

const now = new Date("2026-10-29T08:00:00Z");

function fakeDb(row: { status: string; expiresAt: Date | null } | null) {
  return {
    testimonialRequest: {
      findUnique: vi.fn(async ({ where }: { where: { token: string } }) =>
        row && where.token === "token_1" ? row : null,
      ),
    },
  } as unknown as FakeDb;
}

describe("isTestimonialRequestDeclinable", () => {
  it("is true for a pending request before its expiry date", async () => {
    await expect(
      isTestimonialRequestDeclinable(
        { token: "token_1", now },
        fakeDb({
          status: "pending",
          expiresAt: new Date("2026-11-20T08:00:00Z"),
        }),
      ),
    ).resolves.toBe(true);
  });

  it.each(["submitted", "declined", "expired"])(
    "is false for a %s request",
    async (status) => {
      await expect(
        isTestimonialRequestDeclinable(
          { token: "token_1", now },
          fakeDb({ status, expiresAt: null }),
        ),
      ).resolves.toBe(false);
    },
  );

  it("is false for a pending request past its expiry date", async () => {
    await expect(
      isTestimonialRequestDeclinable(
        { token: "token_1", now },
        fakeDb({
          status: "pending",
          expiresAt: new Date("2026-10-28T08:00:00Z"),
        }),
      ),
    ).resolves.toBe(false);
  });

  it("is false for a token matching no request", async () => {
    await expect(
      isTestimonialRequestDeclinable({ token: "unknown", now }, fakeDb(null)),
    ).resolves.toBe(false);
  });
});
