import { beforeEach, describe, expect, it, vi } from "vitest";

import { expireOrganizationTestimonialRequest } from "./expire-organization-testimonial-request";

const send = vi
  .fn<(payload: unknown) => Promise<void>>()
  .mockResolvedValue(undefined);

vi.mock("@/server/inngest", () => ({
  inngest: { send: (payload: unknown) => send(payload) },
}));

type FakeDb = NonNullable<
  Parameters<typeof expireOrganizationTestimonialRequest>[1]
>;

type Row = {
  id: string;
  organizationId: string;
  status: string;
  closedAt: Date | null;
};

// Applies the guarded write to an in-memory row, so the test reads the
// resulting state instead of the query.
function fakeDb(row: Row | null) {
  return {
    testimonialRequest: {
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { organizationId: string; status: string };
          data: { status: string; closedAt: Date };
        }) => {
          if (
            !row ||
            row.organizationId !== where.organizationId ||
            row.status !== where.status
          ) {
            return { count: 0 };
          }
          Object.assign(row, data);
          return { count: 1 };
        },
      ),
      findUnique: vi.fn(async () => (row ? { id: row.id } : null)),
    },
  } as unknown as FakeDb;
}

function requestRow(status: string): Row {
  return { id: "request_1", organizationId: "org_1", status, closedAt: null };
}

const now = new Date("2026-10-29T08:00:00Z");

describe("expireOrganizationTestimonialRequest", () => {
  beforeEach(() => {
    send.mockClear();
  });

  it("expires the pending request and emits request.closed", async () => {
    const row = requestRow("pending");

    await expect(
      expireOrganizationTestimonialRequest(
        { organizationId: "org_1", now },
        fakeDb(row),
      ),
    ).resolves.toEqual({ requestId: "request_1" });

    expect(row).toMatchObject({ status: "expired", closedAt: now });
    expect(send).toHaveBeenCalledWith({
      name: "testimonial/request.closed",
      data: { requestId: "request_1" },
    });
  });

  it.each(["submitted", "declined", "expired"])(
    "leaves a %s request untouched and emits nothing",
    async (status) => {
      const row = requestRow(status);

      await expect(
        expireOrganizationTestimonialRequest(
          { organizationId: "org_1", now },
          fakeDb(row),
        ),
      ).resolves.toBeNull();

      expect(row).toMatchObject({ status, closedAt: null });
      expect(send).not.toHaveBeenCalled();
    },
  );

  it("emits nothing when the Organization was never asked", async () => {
    await expect(
      expireOrganizationTestimonialRequest(
        { organizationId: "org_1", now },
        fakeDb(null),
      ),
    ).resolves.toBeNull();

    expect(send).not.toHaveBeenCalled();
  });

  it("does not fail the deletion when the event cannot be sent", async () => {
    send.mockRejectedValueOnce(new Error("Inngest unavailable"));
    vi.spyOn(console, "error").mockImplementationOnce(() => {});

    await expect(
      expireOrganizationTestimonialRequest(
        { organizationId: "org_1", now },
        fakeDb(requestRow("pending")),
      ),
    ).resolves.toEqual({ requestId: "request_1" });
  });
});
