import { beforeEach, describe, expect, it, vi } from "vitest";

import { submitTestimonial } from "./submit-testimonial";

const send = vi
  .fn<(payload: unknown) => Promise<void>>()
  .mockResolvedValue(undefined);

vi.mock("@/server/inngest", () => ({
  inngest: { send: (payload: unknown) => send(payload) },
}));

// An in-memory bucket: the test reads which objects exist afterwards.
const bucket = new Map<string, string>();

vi.mock("@/server/storage/objects", () => ({
  copyStorageObject: async ({
    sourceKey,
    destinationKey,
  }: {
    sourceKey: string;
    destinationKey: string;
  }) => {
    const object = bucket.get(sourceKey);
    if (object === undefined) return Promise.reject(new Error("NoSuchKey"));
    bucket.set(destinationKey, object);
  },
  putStorageObject: async ({
    key,
    contentType,
  }: {
    key: string;
    contentType: string;
  }) => {
    bucket.set(key, contentType);
  },
  deleteStorageObject: async ({ key }: { key: string }) => {
    bucket.delete(key);
  },
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
  user: { image: string | null } | null;
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
    user: { image: "user-avatars/user_1/100.png" },
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
  photo: { source: "none" as const },
  consent: true,
};

const photoKey = `testimonial-photos/request_1/${now.getTime()}`;

// Serves the row by token and applies writes in memory, so the test reads the
// resulting state instead of the query. The transaction runs on the same fake.
// `servedRow` lets the read return a stale copy, as when another submission
// closes the request between the read and the write.
function fakeDb(row: RequestRow | null, servedRow = row) {
  const testimonials: TestimonialRow[] = [];

  const db = {
    testimonials,
    testimonialRequest: {
      findUnique: vi.fn(async ({ where }: { where: { token: string } }) =>
        servedRow && servedRow.token === where.token ? { ...servedRow } : null,
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
    bucket.clear();
    bucket.set("user-avatars/user_1/100.png", "avatar");
    vi.unstubAllGlobals();
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

  describe("photo", () => {
    it("stores no photo when the User removed it", async () => {
      const db = fakeDb(requestRow());

      await submitTestimonial({ token: "token_1", now, testimonial }, db);

      expect(db.testimonials[0]).toMatchObject({ photoKey: null });
      expect([...bucket.keys()]).toEqual(["user-avatars/user_1/100.png"]);
    });

    it("copies the kept avatar to a Testimonial-owned key", async () => {
      const db = fakeDb(requestRow());

      await submitTestimonial(
        {
          token: "token_1",
          now,
          testimonial: { ...testimonial, photo: { source: "avatar" } },
        },
        db,
      );

      expect(db.testimonials[0]).toMatchObject({
        photoKey: `${photoKey}.png`,
      });
      expect(bucket.get(`${photoKey}.png`)).toBe("avatar");
      // The avatar itself is left to the account.
      expect(bucket.has("user-avatars/user_1/100.png")).toBe(true);
    });

    it("stores no photo when the User keeps an avatar they do not have", async () => {
      const db = fakeDb(requestRow({ user: { image: null } }));

      await submitTestimonial(
        {
          token: "token_1",
          now,
          testimonial: { ...testimonial, photo: { source: "avatar" } },
        },
        db,
      );

      expect(db.testimonials[0]).toMatchObject({ photoKey: null });
    });

    it("fetches a provider avatar and stores it under a Testimonial-owned key", async () => {
      const fetchDouble = vi.fn(
        async () =>
          new Response(new Uint8Array([1, 2, 3]), {
            headers: { "content-type": "image/jpeg" },
          }),
      );
      vi.stubGlobal("fetch", fetchDouble);
      const db = fakeDb(
        requestRow({ user: { image: "https://avatars.example.com/u/1" } }),
      );

      await submitTestimonial(
        {
          token: "token_1",
          now,
          testimonial: { ...testimonial, photo: { source: "avatar" } },
        },
        db,
      );

      expect(fetchDouble).toHaveBeenCalledWith(
        new URL("https://avatars.example.com/u/1"),
        expect.objectContaining({ redirect: "error" }),
      );
      expect(db.testimonials[0]).toMatchObject({
        photoKey: `${photoKey}.jpeg`,
      });
      expect(bucket.get(`${photoKey}.jpeg`)).toBe("image/jpeg");
    });

    it.each([
      "http://avatars.example.com/u/1",
      "https://169.254.169.254/latest",
      "https://localhost/avatar.png",
    ])("refuses to fetch the avatar URL %s", async (image) => {
      const fetchDouble = vi.fn();
      vi.stubGlobal("fetch", fetchDouble);
      const db = fakeDb(requestRow({ user: { image } }));

      await expect(
        submitTestimonial(
          {
            token: "token_1",
            now,
            testimonial: { ...testimonial, photo: { source: "avatar" } },
          },
          db,
        ),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      expect(fetchDouble).not.toHaveBeenCalled();
      expect(db.testimonials).toEqual([]);
    });

    it("refuses a provider avatar that is not an image", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(
          async () =>
            new Response("<html>", {
              headers: { "content-type": "text/html" },
            }),
        ),
      );
      const db = fakeDb(
        requestRow({ user: { image: "https://avatars.example.com/u/1" } }),
      );

      await expect(
        submitTestimonial(
          {
            token: "token_1",
            now,
            testimonial: { ...testimonial, photo: { source: "avatar" } },
          },
          db,
        ),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      expect(db.testimonials).toEqual([]);
    });

    it("copies an uploaded photo and deletes the staged upload", async () => {
      const uploadKey = "testimonial-uploads/request_1/200.webp";
      bucket.set(uploadKey, "upload");
      const db = fakeDb(requestRow());

      await submitTestimonial(
        {
          token: "token_1",
          now,
          testimonial: {
            ...testimonial,
            photo: { source: "upload", key: uploadKey },
          },
        },
        db,
      );

      expect(db.testimonials[0]).toMatchObject({
        photoKey: `${photoKey}.webp`,
      });
      expect(bucket.get(`${photoKey}.webp`)).toBe("upload");
      expect(bucket.has(uploadKey)).toBe(false);
    });

    it.each([
      "user-avatars/user_2/100.png",
      "testimonial-uploads/request_2/200.png",
      "testimonial-uploads/request_1/../../user-avatars/user_2/100.png",
    ])(
      "refuses to copy %s, which was not uploaded for this request",
      async (key) => {
        bucket.set(key, "foreign");
        const db = fakeDb(requestRow());

        await expect(
          submitTestimonial(
            {
              token: "token_1",
              now,
              testimonial: { ...testimonial, photo: { source: "upload", key } },
            },
            db,
          ),
        ).rejects.toMatchObject({ code: "BAD_REQUEST" });

        expect(db.testimonials).toEqual([]);
        expect(bucket.size).toBe(2);
      },
    );

    it("deletes the copied photo when the submission loses a race", async () => {
      const db = fakeDb(requestRow({ status: "submitted" }), requestRow());

      await expect(
        submitTestimonial(
          {
            token: "token_1",
            now,
            testimonial: { ...testimonial, photo: { source: "avatar" } },
          },
          db,
        ),
      ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });

      expect([...bucket.keys()]).toEqual(["user-avatars/user_1/100.png"]);
    });
  });
});
