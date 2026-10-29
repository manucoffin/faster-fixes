import { ConflictError, NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";

import { updateTestimonialStatus } from "./update-testimonial-status";

type FakeDb = NonNullable<Parameters<typeof updateTestimonialStatus>[1]>;

const now = new Date("2026-10-29T08:00:00Z");

function fakeDb(testimonial: { status: string } | null) {
  return {
    testimonial: {
      findUnique: vi.fn().mockResolvedValue(testimonial),
      update: vi.fn(
        ({ data }: { data: { status: string; statusChangedAt: Date } }) =>
          Promise.resolve({ id: "testimonial_1", ...data }),
      ),
    },
  } as unknown as FakeDb;
}

describe("updateTestimonialStatus", () => {
  it.each([
    ["pending", "published"],
    ["pending", "rejected"],
    ["published", "pending"],
  ] as const)("moves a %s Testimonial to %s", async (from, to) => {
    await expect(
      updateTestimonialStatus(
        { testimonialId: "testimonial_1", status: to, now },
        fakeDb({ status: from }),
      ),
    ).resolves.toEqual({
      id: "testimonial_1",
      status: to,
      statusChangedAt: now,
    });
  });

  it.each([
    ["pending", "pending"],
    ["published", "published"],
    ["published", "rejected"],
    ["rejected", "published"],
    ["rejected", "pending"],
  ] as const)("refuses to move a %s Testimonial to %s", async (from, to) => {
    await expect(
      updateTestimonialStatus(
        { testimonialId: "testimonial_1", status: to, now },
        fakeDb({ status: from }),
      ),
    ).rejects.toThrow(ConflictError);
  });

  it("reports an unknown Testimonial as a not found domain error", async () => {
    await expect(
      updateTestimonialStatus(
        { testimonialId: "absent", status: "published", now },
        fakeDb(null),
      ),
    ).rejects.toThrow(new NotFoundError("Testimonial not found"));
  });
});
