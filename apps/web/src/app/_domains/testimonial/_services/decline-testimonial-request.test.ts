import { beforeEach, describe, expect, it, vi } from "vitest";

import { declineTestimonialRequest } from "./decline-testimonial-request";

const send = vi
  .fn<(payload: unknown) => Promise<void>>()
  .mockResolvedValue(undefined);

vi.mock("@/server/inngest", () => ({
  inngest: { send: (payload: unknown) => send(payload) },
}));

type FakeDb = NonNullable<Parameters<typeof declineTestimonialRequest>[1]>;

type RequestRow = {
  id: string;
  token: string;
  status: string;
  expiresAt: Date | null;
  closedAt: Date | null;
};

const now = new Date("2026-10-29T08:00:00Z");

function requestRow(fields: Partial<RequestRow> = {}): RequestRow {
  return {
    id: "request_1",
    token: "token_1",
    status: "pending",
    expiresAt: new Date("2026-11-20T08:00:00Z"),
    closedAt: null,
    ...fields,
  };
}

// Serves the row by token and applies writes in memory, so the test reads the
// resulting state instead of the query.
function fakeDb(row: RequestRow | null) {
  return {
    testimonialRequest: {
      findUnique: vi.fn(async ({ where }: { where: { token: string } }) =>
        row && row.token === where.token ? { ...row } : null,
      ),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string; status: string };
          data: { status: string; closedAt: Date };
        }) => {
          if (!row || row.id !== where.id || row.status !== where.status) {
            return { count: 0 };
          }
          Object.assign(row, data);
          return { count: 1 };
        },
      ),
    },
  } as unknown as FakeDb;
}

describe("declineTestimonialRequest", () => {
  beforeEach(() => {
    send.mockClear();
  });

  it("moves a pending request to declined and stamps the closed timestamp", async () => {
    const row = requestRow();

    await expect(
      declineTestimonialRequest({ token: "token_1", now }, fakeDb(row)),
    ).resolves.toEqual({ status: "declined" });

    expect(row).toMatchObject({ status: "declined", closedAt: now });
  });

  it("emits request.closed so the reminder is cancelled", async () => {
    await declineTestimonialRequest(
      { token: "token_1", now },
      fakeDb(requestRow()),
    );

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "testimonial/request.closed",
        data: { requestId: "request_1" },
      }),
    );
  });

  it.each(["submitted", "declined", "expired"])(
    "leaves a %s request untouched",
    async (status) => {
      const closedAt = new Date("2026-10-20T08:00:00Z");
      const row = requestRow({ status, closedAt });

      await expect(
        declineTestimonialRequest({ token: "token_1", now }, fakeDb(row)),
      ).resolves.toEqual({ status: "handled" });

      expect(row).toMatchObject({ status, closedAt });
      expect(send).not.toHaveBeenCalled();
    },
  );

  it("reports a token matching no request as handled", async () => {
    await expect(
      declineTestimonialRequest(
        { token: "unknown", now },
        fakeDb(requestRow()),
      ),
    ).resolves.toEqual({ status: "handled" });

    expect(send).not.toHaveBeenCalled();
  });

  it("expires a pending request past its expiry date instead of declining it", async () => {
    const row = requestRow({ expiresAt: new Date("2026-10-28T08:00:00Z") });

    await expect(
      declineTestimonialRequest({ token: "token_1", now }, fakeDb(row)),
    ).resolves.toEqual({ status: "handled" });

    expect(row).toMatchObject({ status: "expired", closedAt: now });
    expect(send).not.toHaveBeenCalled();
  });

  it("keeps the decline when the event cannot be emitted", async () => {
    send.mockRejectedValueOnce(new Error("Inngest unavailable"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const row = requestRow();

    await expect(
      declineTestimonialRequest({ token: "token_1", now }, fakeDb(row)),
    ).resolves.toEqual({ status: "declined" });

    expect(row.status).toBe("declined");
  });
});
