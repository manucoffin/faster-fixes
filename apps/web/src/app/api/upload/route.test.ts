/**
 * Characterization tests: they pin what the upload button observes today
 * (status, JSON body, signed object key) on `POST /api/upload`, on the refusal
 * paths and on an accepted upload, so moving the Member lookup behind a service
 * can be proven behaviour-preserving. They assert on responses only, never on
 * how the handler reaches them.
 *
 * A test here that has to change is a broken contract: the two client upload
 * hooks read these bodies to tell the User why an upload was refused.
 */

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const BUCKET = "uploads-test";
const ORGANIZATION_ID = "org_1";
const USER_ID = "user_1";
const MEMBER_ID = "member_1";
const UPLOADED_AT = new Date("2026-01-15T10:00:00.000Z");

const REQUEST_ID = "request_1";
const TOKEN = "token_1";

const uploadPrisma = {
  member: { findFirst: vi.fn() },
  testimonialRequest: { findUnique: vi.fn() },
};

const getSessionDouble = vi.fn();
const checkRateLimitDouble = vi.fn();

vi.mock("@workspace/db", () => ({ prisma: uploadPrisma }));

vi.mock("@/server/auth", () => ({
  auth: { api: { getSession: getSessionDouble } },
}));

vi.mock("@/server/rate-limit/check-rate-limit", () => ({
  checkRateLimit: checkRateLimitDouble,
}));

// A signing double: the real client would need R2 credentials, and the signed
// URL is only asserted for the object key the route builds.
vi.mock("@better-upload/server/clients", () => {
  const createClient = () => ({
    buildBucketUrl: (bucket: string) => `https://storage.test/${bucket}`,
    s3: {
      sign: async (url: string) => ({ url: `${url}&X-Amz-Signature=test` }),
    },
  });
  return { aws: createClient, cloudflare: createClient, custom: createClient };
});

// The router reads the bucket name from the environment on each request, and
// fails when it is missing.
vi.stubEnv("STORAGE_BUCKET_NAME", BUCKET);

const { POST } = await import("./route");

type UploadBody = {
  route?: string;
  files?: { name: string; size: number; type: string }[];
  metadata?: unknown;
};

function uploadRequest(body: UploadBody) {
  return new Request("https://app.test/api/upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function organizationLogoRequest(
  metadata: unknown = { organizationId: ORGANIZATION_ID },
) {
  return uploadRequest({
    route: "organization-logo",
    files: [{ name: "logo.png", size: 1024, type: "image/png" }],
    metadata,
  });
}

function userAvatarRequest() {
  return uploadRequest({
    route: "user-avatar",
    files: [{ name: "me.png", size: 1024, type: "image/png" }],
  });
}

function testimonialPhotoRequest(metadata: unknown = { token: TOKEN }) {
  return uploadRequest({
    route: "testimonial-photo",
    files: [{ name: "me.jpeg", size: 1024, type: "image/jpeg" }],
    metadata,
  });
}

// Loose objects: the accepted-upload case asserts the whole file entry.
const signedUploadSchema = z.object({
  files: z.array(
    z.object({
      signedUrl: z.string(),
      file: z.looseObject({
        objectInfo: z.looseObject({ key: z.string() }),
      }),
    }),
  ),
  metadata: z.unknown(),
});

type SignedUpload = z.infer<typeof signedUploadSchema>;

async function readSignedUpload(response: Response) {
  return signedUploadSchema.parse(await response.json());
}

function signedKey(upload: SignedUpload) {
  return new URL(upload.files[0]!.signedUrl).pathname;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.setSystemTime(UPLOADED_AT);
  getSessionDouble.mockResolvedValue({ user: { id: USER_ID } });
  uploadPrisma.member.findFirst.mockResolvedValue({ id: MEMBER_ID });
  uploadPrisma.testimonialRequest.findUnique.mockResolvedValue({
    id: REQUEST_ID,
    status: "pending",
    expiresAt: new Date("2026-02-01T10:00:00.000Z"),
    userId: USER_ID,
  });
  checkRateLimitDouble.mockResolvedValue({ allowed: true });
});

afterAll(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("POST /api/upload, organization logo", () => {
  it("refuses a signed out caller", async () => {
    getSessionDouble.mockResolvedValue(null);

    const response = await POST(organizationLogoRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { type: "rejected", message: "Unauthorized" },
    });
    expect(uploadPrisma.member.findFirst).not.toHaveBeenCalled();
  });

  it("refuses a caller who is not an owner or admin Member of the Organization", async () => {
    uploadPrisma.member.findFirst.mockResolvedValue(null);

    const response = await POST(organizationLogoRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        type: "rejected",
        message: "You do not have permission to modify this organization.",
      },
    });
  });

  it("looks the caller up among the owners and admins of the Organization", async () => {
    await POST(organizationLogoRequest());

    expect(uploadPrisma.member.findFirst).toHaveBeenCalledWith({
      where: {
        organizationId: ORGANIZATION_ID,
        userId: USER_ID,
        role: { in: ["owner", "admin"] },
      },
    });
  });

  it("signs an upload for an owner or admin Member under the Organization prefix", async () => {
    const response = await POST(organizationLogoRequest());

    expect(response.status).toBe(200);
    const body = await readSignedUpload(response);
    expect(signedKey(body)).toBe(
      `/${BUCKET}/organization-logos/${ORGANIZATION_ID}/${UPLOADED_AT.getTime()}.png`,
    );
    expect(body.files[0]!.file).toEqual({
      name: "logo.png",
      size: 1024,
      type: "image/png",
      objectInfo: {
        key: `organization-logos/${ORGANIZATION_ID}/${UPLOADED_AT.getTime()}.png`,
        metadata: {},
      },
    });
    expect(body.metadata).toEqual({});
  });

  it("keeps the file extension of a webp logo", async () => {
    const response = await POST(
      uploadRequest({
        route: "organization-logo",
        files: [{ name: "logo.webp", size: 1024, type: "image/webp" }],
        metadata: { organizationId: ORGANIZATION_ID },
      }),
    );

    const body = await readSignedUpload(response);
    expect(body.files[0]!.file.objectInfo.key).toBe(
      `organization-logos/${ORGANIZATION_ID}/${UPLOADED_AT.getTime()}.webp`,
    );
  });

  it("refuses a request that carries no Organization", async () => {
    const response = await POST(organizationLogoRequest({}));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { type: "invalid_request", message: "Invalid metadata." },
    });
    expect(getSessionDouble).not.toHaveBeenCalled();
  });

  it("refuses a file type the route does not accept", async () => {
    const response = await POST(
      uploadRequest({
        route: "organization-logo",
        files: [{ name: "logo.gif", size: 1024, type: "image/gif" }],
        metadata: { organizationId: ORGANIZATION_ID },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        type: "invalid_file_type",
        message: "One or more files have an invalid file type.",
      },
    });
    expect(getSessionDouble).not.toHaveBeenCalled();
  });
});

describe("POST /api/upload, user avatar", () => {
  it("refuses a signed out caller", async () => {
    getSessionDouble.mockResolvedValue(null);

    const response = await POST(userAvatarRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { type: "rejected", message: "Unauthorized" },
    });
  });

  it("signs an upload under the User prefix without any Member lookup", async () => {
    const response = await POST(userAvatarRequest());

    expect(response.status).toBe(200);
    const body = await readSignedUpload(response);
    expect(signedKey(body)).toBe(
      `/${BUCKET}/user-avatars/${USER_ID}/${UPLOADED_AT.getTime()}.png`,
    );
    expect(uploadPrisma.member.findFirst).not.toHaveBeenCalled();
  });
});

describe("POST /api/upload, testimonial photo", () => {
  it("signs an upload for a pending token under the request prefix, without a session", async () => {
    getSessionDouble.mockResolvedValue(null);

    const response = await POST(testimonialPhotoRequest());

    expect(response.status).toBe(200);
    const body = await readSignedUpload(response);
    expect(signedKey(body)).toBe(
      `/${BUCKET}/testimonial-uploads/${REQUEST_ID}/${UPLOADED_AT.getTime()}.jpeg`,
    );
    expect(checkRateLimitDouble).toHaveBeenCalledWith(
      TOKEN,
      "testimonial-token",
    );
  });

  it("refuses a token matching no request", async () => {
    uploadPrisma.testimonialRequest.findUnique.mockResolvedValue(null);

    const response = await POST(testimonialPhotoRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { type: "rejected", message: "This link no longer works." },
    });
  });

  it.each(["submitted", "declined", "expired"])(
    "refuses a %s request",
    async (status) => {
      uploadPrisma.testimonialRequest.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        status,
        expiresAt: null,
        userId: USER_ID,
      });

      const response = await POST(testimonialPhotoRequest());

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: { type: "rejected", message: "This link no longer works." },
      });
    },
  );

  it("refuses a pending request past its expiry date", async () => {
    uploadPrisma.testimonialRequest.findUnique.mockResolvedValue({
      id: REQUEST_ID,
      status: "pending",
      expiresAt: new Date("2026-01-01T10:00:00.000Z"),
      userId: USER_ID,
    });

    const response = await POST(testimonialPhotoRequest());

    expect(response.status).toBe(400);
  });

  it("refuses a token over its rate limit before resolving it", async () => {
    checkRateLimitDouble.mockResolvedValue({ allowed: false });

    const response = await POST(testimonialPhotoRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        type: "rejected",
        message: "Too many uploads. Try again later.",
      },
    });
    expect(uploadPrisma.testimonialRequest.findUnique).not.toHaveBeenCalled();
  });

  it("refuses a request that carries no token", async () => {
    const response = await POST(testimonialPhotoRequest({}));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { type: "invalid_request", message: "Invalid metadata." },
    });
  });

  it("refuses a file larger than the avatar limit", async () => {
    const response = await POST(
      uploadRequest({
        route: "testimonial-photo",
        files: [{ name: "me.png", size: 3 * 1024 * 1024, type: "image/png" }],
        metadata: { token: TOKEN },
      }),
    );

    expect(response.status).toBe(400);
    expect(uploadPrisma.testimonialRequest.findUnique).not.toHaveBeenCalled();
  });
});
