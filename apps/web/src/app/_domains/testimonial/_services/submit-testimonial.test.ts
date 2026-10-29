import { beforeEach, describe, expect, it, vi } from "vitest";

import { submitTestimonial } from "./submit-testimonial";

const send = vi
  .fn<(payload: unknown) => Promise<void>>()
  .mockResolvedValue(undefined);

vi.mock("@/server/inngest", () => ({
  inngest: { send: (payload: unknown) => send(payload) },
}));

type FakeDb = NonNullable<Parameters<typeof submitTestimonial>[1]>;

type RequestRow = {
  id: string;
  token: string;
  status: string;
  expiresAt: Date | null;
  closedAt: Date | null;
  userId: string | null;
  organizationId: string | null;
};

type TestimonialRow = Record<string, unknown> & { id: string };

const now = new Date("2026-10-29T08:00:00Z");

function requestRow(fields: Partial<RequestRow> = {}): RequestRow {
  return {
    id: "request_1",
    token: "token_1",
    status: "pending",
    expiresAt: new Date("2026-11-20T08:00:00Z"),
    closedAt: null,
    userId: "user_1",
    organizationId: "org_1",
    ...fields,
  };
}

const testimonial = {
  rating: 3,
  text: "It cut our review rounds in half.",
  name: "Ada",
  title: "Founder",
  organization: "Acme Labs",
  website: "https://acme.dev",
  consent: true,
};

// Serves the row by token and applies writes in memory, so the test reads the
// resulting state instead of the query. The transaction runs on the same fake.
function fakeDb(row: RequestRow | null) {
  const testimonials: TestimonialRow[] = [];

  const db = {
    testimonials,
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
    testimonial: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const created = {
          id: `testimonial_${testimonials.length + 1}`,
          ...data,
        };
        testimonials.push(created);
        return created;
      }),
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(db)),
  };

  return db as unknown as FakeDb & { testimonials: TestimonialRow[] };
}

describe("submitTestimonial", () => {
  beforeEach(() => {
    send.mockClear();
  });

  it("stores a pending Testimonial with the submitted values as a snapshot", async () => {
    const db = fakeDb(requestRow());

    await submitTestimonial({ token: "token_1", now, testimonial }, db);

    expect(db.testimonials).toEqual([
      expect.objectContaining({
        rating: 3,
        text: "It cut our review rounds in half.",
        authorName: "Ada",
        authorTitle: "Founder",
        organizationName: "Acme Labs",
        websiteUrl: "https://acme.dev",
        status: "pending",
        consentAt: now,
        statusChangedAt: now,
        testimonialRequestId: "request_1",
        userId: "user_1",
        organizationId: "org_1",
      }),
    ]);
  });

  it("stores an empty title and website as missing", async () => {
    const db = fakeDb(requestRow());

    await submitTestimonial(
      {
        token: "token_1",
        now,
        testimonial: { ...testimonial, title: "", website: "" },
      },
      db,
    );

    expect(db.testimonials[0]).toMatchObject({
      authorTitle: null,
      websiteUrl: null,
    });
  });

  it("moves the request to submitted and emits request.closed", async () => {
    const row = requestRow();

    await submitTestimonial(
      { token: "token_1", now, testimonial },
      fakeDb(row),
    );

    expect(row).toMatchObject({ status: "submitted", closedAt: now });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "testimonial/request.closed",
        data: { requestId: "request_1" },
      }),
    );
  });

  it("refuses a second submission with the same token", async () => {
    const db = fakeDb(requestRow());
    await submitTestimonial({ token: "token_1", now, testimonial }, db);
    send.mockClear();

    await expect(
      submitTestimonial({ token: "token_1", now, testimonial }, db),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });

    expect(db.testimonials).toHaveLength(1);
    expect(send).not.toHaveBeenCalled();
  });

  it("refuses a token matching no request", async () => {
    await expect(
      submitTestimonial(
        { token: "unknown", now, testimonial },
        fakeDb(requestRow()),
      ),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it.each(["declined", "expired"])("refuses a %s request", async (status) => {
    const db = fakeDb(requestRow({ status }));

    await expect(
      submitTestimonial({ token: "token_1", now, testimonial }, db),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });

    expect(db.testimonials).toEqual([]);
  });

  it("refuses a pending request past its expiry date and persists the expiry", async () => {
    const row = requestRow({ expiresAt: new Date("2026-10-28T08:00:00Z") });
    const db = fakeDb(row);

    await expect(
      submitTestimonial({ token: "token_1", now, testimonial }, db),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });

    expect(row).toMatchObject({ status: "expired", closedAt: now });
    expect(db.testimonials).toEqual([]);
  });

  it("refuses a request whose Organization was deleted", async () => {
    await expect(
      submitTestimonial(
        { token: "token_1", now, testimonial },
        fakeDb(requestRow({ organizationId: null })),
      ),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("keeps the submission when the event cannot be emitted", async () => {
    send.mockRejectedValueOnce(new Error("Inngest unavailable"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const db = fakeDb(requestRow());

    await expect(
      submitTestimonial({ token: "token_1", now, testimonial }, db),
    ).resolves.toMatchObject({ authorName: "Ada" });

    expect(db.testimonials).toHaveLength(1);
  });
});
