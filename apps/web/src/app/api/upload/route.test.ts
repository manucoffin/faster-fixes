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

const PROJECT_ID = "project_1";
const VIDEO_ID = "video_1";
const MB = 1_000_000;
const GB = 1_000_000_000;

type VideoRow = {
  id: string;
  projectId: string;
  organizationId: string;
  state: string;
  size: bigint;
  uploadedById: string | null;
  [column: string]: unknown;
};

type VideoWhere = {
  id?: string;
  state?: string;
  uploadedById?: string;
  project?: { organizationId?: string };
};

// An in-memory Video table: the reservation writes to it and the quota and
// Poster lookups read it, so the tests assert on the rows it ends up holding.
let videoRows: VideoRow[] = [];
// Organizations the caller is a Member of, read by the Poster lookup.
let memberOrganizationIds: string[] = [];

function videosMatching(where: VideoWhere) {
  return videoRows.filter(
    (row) =>
      (where.id === undefined || row.id === where.id) &&
      (where.state === undefined || row.state === where.state) &&
      (where.uploadedById === undefined ||
        row.uploadedById === where.uploadedById) &&
      (where.project?.organizationId === undefined ||
        row.organizationId === where.project.organizationId),
  );
}

const uploadPrisma = {
  member: { findFirst: vi.fn() },
  testimonialRequest: { findUnique: vi.fn() },
  project: { findFirst: vi.fn() },
  subscription: { findFirst: vi.fn() },
  video: {
    count: vi.fn(({ where }: { where: VideoWhere }) =>
      Promise.resolve(videosMatching(where).length),
    ),
    aggregate: vi.fn(({ where }: { where: VideoWhere }) => {
      const rows = videosMatching(where);
      return Promise.resolve({
        _sum: {
          size: rows.length ? rows.reduce((sum, v) => sum + v.size, 0n) : null,
        },
      });
    }),
    create: vi.fn(
      ({
        data,
      }: {
        data: Pick<VideoRow, "projectId" | "size" | "uploadedById">;
      }) => {
        const row: VideoRow = {
          ...data,
          id: VIDEO_ID,
          organizationId: ORGANIZATION_ID,
          state: "uploading",
        };
        videoRows.push(row);
        return Promise.resolve({ id: row.id, projectId: row.projectId });
      },
    ),
    findFirst: vi.fn(({ where }: { where: VideoWhere }) => {
      const row = videosMatching(where).find((v) =>
        memberOrganizationIds.includes(v.organizationId),
      );
      return Promise.resolve(
        row ? { id: row.id, projectId: row.projectId } : null,
      );
    }),
  },
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
      // Answers CreateMultipartUpload, the one call a multipart route sends.
      fetch: async () =>
        new Response(
          "<InitiateMultipartUploadResult><UploadId>upload_1</UploadId></InitiateMultipartUploadResult>",
        ),
    },
  });
  return { aws: createClient, cloudflare: createClient, custom: createClient };
});

// The router reads the bucket name from the environment on each request, and
// fails when it is missing.
vi.stubEnv("STORAGE_BUCKET_NAME", BUCKET);
// The Share link secret is encrypted under a key derived from it, and the
// local provider signs its URLs with it.
vi.stubEnv("BETTER_AUTH_SECRET", "test-auth-secret");
vi.stubEnv("BETTER_AUTH_URL", "https://app.test");

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
  uploadPrisma.project.findFirst.mockResolvedValue({
    id: PROJECT_ID,
    organizationId: ORGANIZATION_ID,
  });
  uploadPrisma.subscription.findFirst.mockResolvedValue(null);
  videoRows = [];
  memberOrganizationIds = [ORGANIZATION_ID];
  vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "true");
  vi.stubEnv("STORAGE_PROVIDER", undefined);
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

const VIDEO_MEDIA = {
  durationMs: 61_500,
  width: 1920,
  height: 1080,
  videoCodec: "avc1",
  hasFastStart: true,
};

function videoRequest({
  name = "Launch film.mp4",
  size = 100 * MB,
  type = "video/mp4",
  metadata = { projectId: PROJECT_ID, ...VIDEO_MEDIA } as unknown,
} = {}) {
  return uploadRequest({
    route: "video",
    files: [{ name, size, type }],
    metadata,
  });
}

function existingVideo(size: number, state = "ready"): VideoRow {
  return {
    id: `video_${videoRows.length + 10}`,
    projectId: PROJECT_ID,
    organizationId: ORGANIZATION_ID,
    state,
    size: BigInt(size),
    uploadedById: USER_ID,
  };
}

const multipartUploadSchema = z.object({
  multipart: z.object({
    files: z.array(
      z.looseObject({
        file: z.looseObject({
          objectInfo: z.looseObject({ key: z.string() }),
        }),
        parts: z.array(z.looseObject({ partNumber: z.number() })),
      }),
    ),
    partSize: z.number(),
  }),
  metadata: z.unknown(),
});

async function expectDenial(response: Response, denial: object) {
  expect(response.status).toBe(400);
  const body = (await response.json()) as {
    error: { type: string; message: string };
  };
  expect(body.error.type).toBe("rejected");
  expect(JSON.parse(body.error.message)).toEqual(denial);
}

describe("POST /api/upload, video", () => {
  it("reserves a Video in uploading state and signs a multipart upload under its folder", async () => {
    const response = await POST(videoRequest());

    expect(response.status).toBe(200);
    const body = multipartUploadSchema.parse(await response.json());
    expect(body.multipart.files[0]!.file.objectInfo.key).toBe(
      `videos/${PROJECT_ID}/${VIDEO_ID}/source.mp4`,
    );
    expect(body.multipart.partSize).toBe(16 * 1024 * 1024);
    expect(body.multipart.files[0]!.parts).toHaveLength(6);
    expect(body.metadata).toEqual({ videoId: VIDEO_ID });

    expect(videoRows).toEqual([
      expect.objectContaining({
        id: VIDEO_ID,
        projectId: PROJECT_ID,
        state: "uploading",
        title: "Launch film",
        filename: "Launch film.mp4",
        mimeType: "video/mp4",
        size: BigInt(100 * MB),
        uploadedById: USER_ID,
        ...VIDEO_MEDIA,
      }),
    ]);
  });

  it("stores the Share link secret as a hash and a ciphertext, never in clear", async () => {
    await POST(videoRequest());

    const row = videoRows[0]!;
    expect(row.shareTokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(row.shareTokenEncrypted).toEqual(expect.any(String));
    expect(row.shareTokenEncrypted).not.toBe(row.shareTokenHash);
  });

  it("keeps a title the client chose and keys a MOV with its extension", async () => {
    const response = await POST(
      videoRequest({
        name: "cut.mov",
        type: "video/quicktime",
        metadata: { projectId: PROJECT_ID, title: "Final cut", ...VIDEO_MEDIA },
      }),
    );

    const body = multipartUploadSchema.parse(await response.json());
    expect(body.multipart.files[0]!.file.objectInfo.key).toBe(
      `videos/${PROJECT_ID}/${VIDEO_ID}/source.mov`,
    );
    expect(videoRows[0]).toMatchObject({
      title: "Final cut",
      mimeType: "video/quicktime",
    });
  });

  it("refuses a declared size above the Plan's per-file cap", async () => {
    const response = await POST(videoRequest({ size: 600 * MB }));

    await expectDenial(response, {
      kind: "videoFileSize",
      size: 600 * MB,
      cap: 500 * MB,
    });
    expect(videoRows).toEqual([]);
  });

  it("refuses an Organization at its Video count", async () => {
    videoRows.push(existingVideo(10 * MB));

    const response = await POST(videoRequest());

    await expectDenial(response, { kind: "videoCount", count: 1, limit: 1 });
    expect(videoRows).toHaveLength(1);
  });

  it("counts uploads in flight toward the storage budget", async () => {
    uploadPrisma.subscription.findFirst.mockResolvedValue({
      plan: "pro",
      status: "active",
    });
    videoRows.push(
      existingVideo(9.5 * GB, "uploading"),
      existingVideo(9.5 * GB, "uploading"),
    );

    const response = await POST(videoRequest({ size: 1.5 * GB }));

    await expectDenial(response, {
      kind: "videoStorage",
      used: 19 * GB,
      budget: 20 * GB,
    });
  });

  it("skips every limit off cloud", async () => {
    vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "false");
    videoRows.push(existingVideo(10 * GB));

    const response = await POST(videoRequest({ size: 3 * GB }));

    expect(response.status).toBe(200);
    expect(videoRows).toHaveLength(2);
  });

  it("refuses a file above the largest cap of any Plan", async () => {
    vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "false");

    const response = await POST(videoRequest({ size: 4.5 * GB }));

    expect(response.status).toBe(400);
    expect(videoRows).toEqual([]);
  });

  it("refuses a file type other than MP4 and MOV", async () => {
    const response = await POST(
      videoRequest({ name: "clip.webm", type: "video/webm" }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { type: "invalid_file_type" },
    });
  });

  it("refuses a caller who is not a Member of the Project's Organization", async () => {
    uploadPrisma.project.findFirst.mockResolvedValue(null);

    const response = await POST(videoRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        type: "rejected",
        message: "You are not a member of this project.",
      },
    });
    expect(videoRows).toEqual([]);
  });

  it("refuses a signed out caller", async () => {
    getSessionDouble.mockResolvedValue(null);

    const response = await POST(videoRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { type: "rejected", message: "Unauthorized" },
    });
    expect(videoRows).toEqual([]);
  });

  it("refuses a request without the parsed media metadata", async () => {
    const response = await POST(
      videoRequest({ metadata: { projectId: PROJECT_ID } }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { type: "invalid_request", message: "Invalid metadata." },
    });
  });

  it("signs a single-part upload on the local provider", async () => {
    vi.stubEnv("STORAGE_PROVIDER", "local");

    const response = await POST(videoRequest());

    expect(response.status).toBe(200);
    const body = await readSignedUpload(response);
    expect(body.files[0]!.file.objectInfo.key).toBe(
      `videos/${PROJECT_ID}/${VIDEO_ID}/source.mp4`,
    );
    expect(new URL(body.files[0]!.signedUrl).pathname).toBe(
      `/api/storage/${BUCKET}/videos/${PROJECT_ID}/${VIDEO_ID}/source.mp4`,
    );
  });
});

function videoPosterRequest(metadata: unknown = { videoId: VIDEO_ID }) {
  return uploadRequest({
    route: "video-poster",
    files: [{ name: "poster.jpg", size: 200_000, type: "image/jpeg" }],
    metadata,
  });
}

describe("POST /api/upload, video poster", () => {
  beforeEach(() => {
    videoRows.push({ ...existingVideo(100 * MB, "uploading"), id: VIDEO_ID });
  });

  it("signs the Poster under the folder of a Video the caller is uploading", async () => {
    const response = await POST(videoPosterRequest());

    expect(response.status).toBe(200);
    const body = await readSignedUpload(response);
    expect(body.files[0]!.file.objectInfo.key).toBe(
      `videos/${PROJECT_ID}/${VIDEO_ID}/poster.jpg`,
    );
  });

  it("refuses a Video already committed", async () => {
    videoRows[0]!.state = "ready";

    const response = await POST(videoPosterRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { type: "rejected", message: "This video is not being uploaded." },
    });
  });

  it("refuses a Video outside the caller's Organizations", async () => {
    memberOrganizationIds = ["org_2"];

    const response = await POST(videoPosterRequest());

    expect(response.status).toBe(400);
  });

  it("refuses a Video another Member is uploading", async () => {
    videoRows[0]!.uploadedById = "user_2";

    const response = await POST(videoPosterRequest());

    expect(response.status).toBe(400);
  });

  it("refuses a signed out caller", async () => {
    getSessionDouble.mockResolvedValue(null);

    const response = await POST(videoPosterRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { type: "rejected", message: "Unauthorized" },
    });
  });

  it("refuses a Poster that is not a JPEG or is over 1 MB", async () => {
    const png = await POST(
      uploadRequest({
        route: "video-poster",
        files: [{ name: "poster.png", size: 200_000, type: "image/png" }],
        metadata: { videoId: VIDEO_ID },
      }),
    );
    const large = await POST(
      uploadRequest({
        route: "video-poster",
        files: [{ name: "poster.jpg", size: 1_500_000, type: "image/jpeg" }],
        metadata: { videoId: VIDEO_ID },
      }),
    );

    expect(png.status).toBe(400);
    expect(large.status).toBe(400);
  });
});
