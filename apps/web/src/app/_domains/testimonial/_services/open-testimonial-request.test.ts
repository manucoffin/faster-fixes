import { describe, expect, it, vi } from "vitest";

import { openTestimonialRequest } from "./open-testimonial-request";

type FakeDb = NonNullable<Parameters<typeof openTestimonialRequest>[1]>;

type Row = {
  id: string;
  token: string;
  status: string;
  expiresAt: Date | null;
  closedAt: Date | null;
  user: {
    name: string;
    image: string | null;
    profile: { firstName: string | null } | null;
  } | null;
  organization: {
    name: string;
    projects: { domain: string }[];
  } | null;
};

const now = new Date("2026-10-29T08:00:00Z");

function requestRow(fields: Partial<Row> = {}): Row {
  return {
    id: "request_1",
    token: "token_1",
    status: "pending",
    expiresAt: new Date("2026-11-20T08:00:00Z"),
    closedAt: null,
    user: {
      name: "Ada Lovelace",
      image: "avatars/ada.png",
      profile: { firstName: "Ada" },
    },
    organization: { name: "Acme", projects: [{ domain: "acme.com" }] },
    ...fields,
  };
}

// Serves the row by token and applies the guarded write in memory, so the
// test reads the resulting state instead of the query.
function fakeDb(row: Row | null) {
  return {
    testimonialRequest: {
      findUnique: vi.fn(async ({ where }: { where: { token: string } }) =>
        row && row.token === where.token ? row : null,
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

describe("openTestimonialRequest", () => {
  it("returns the prefill of a pending request", async () => {
    await expect(
      openTestimonialRequest({ token: "token_1", now }, fakeDb(requestRow())),
    ).resolves.toEqual({
      state: "open",
      requestId: "request_1",
      prefill: {
        name: "Ada",
        organization: "Acme",
        website: "https://acme.com",
        image: "avatars/ada.png",
      },
    });
  });

  it("opens a pending request whose first email is not sent yet", async () => {
    const result = await openTestimonialRequest(
      { token: "token_1", now },
      fakeDb(requestRow({ expiresAt: null })),
    );

    expect(result.state).toBe("open");
  });

  it("falls back to the User name without a Profile first name", async () => {
    const result = await openTestimonialRequest(
      { token: "token_1", now },
      fakeDb(
        requestRow({
          user: { name: "Ada Lovelace", image: null, profile: null },
        }),
      ),
    );

    expect(result).toMatchObject({
      prefill: { name: "Ada Lovelace", image: null },
    });
  });

  it("leaves the website empty when the Organization has no Project", async () => {
    const result = await openTestimonialRequest(
      { token: "token_1", now },
      fakeDb(requestRow({ organization: { name: "Acme", projects: [] } })),
    );

    expect(result).toMatchObject({ prefill: { website: "" } });
  });

  it("refuses a token matching no request", async () => {
    await expect(
      openTestimonialRequest({ token: "unknown", now }, fakeDb(requestRow())),
    ).resolves.toEqual({ state: "expired" });
  });

  it.each(["submitted", "declined", "expired"])(
    "refuses a %s request and leaves it untouched",
    async (status) => {
      const row = requestRow({ status });

      await expect(
        openTestimonialRequest({ token: "token_1", now }, fakeDb(row)),
      ).resolves.toEqual({ state: "expired" });

      expect(row).toMatchObject({ status, closedAt: null });
    },
  );

  it("refuses a pending request past its expiry date and persists the expiry", async () => {
    const row = requestRow({ expiresAt: new Date("2026-10-28T08:00:00Z") });

    await expect(
      openTestimonialRequest({ token: "token_1", now }, fakeDb(row)),
    ).resolves.toEqual({ state: "expired" });

    expect(row).toMatchObject({ status: "expired", closedAt: now });
  });

  it("refuses a request whose Organization was deleted", async () => {
    await expect(
      openTestimonialRequest(
        { token: "token_1", now },
        fakeDb(requestRow({ organization: null })),
      ),
    ).resolves.toEqual({ state: "expired" });
  });
});
