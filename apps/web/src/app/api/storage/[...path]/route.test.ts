/**
 * Characterization tests: they pin what a browser observes on
 * `GET /api/storage/<bucket>/<key>` with the local provider (status, headers,
 * body) and which keys are reachable without a token, so widening the route to
 * the other providers can be proven to leave the local path untouched. They
 * assert on responses only, never on how the handler reaches them.
 *
 * The S3 cases pin the contract the other providers add: avatar and logo keys
 * redirect to a short-lived signed URL, everything else stays unreachable.
 */

import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const BUCKET = "uploads-test";
const AVATAR_KEY = "user-avatars/user_1/1700000000000.png";
const LOGO_KEY = "organization-logos/org_1/1700000000000.webp";
const SCREENSHOT_KEY = "feedback-screenshots/feedback_1/shot.png";
const PNG_BYTES = Buffer.from("png-bytes");
const SIGNED_URL = "https://bucket.storage.test/signed?X-Amz-Signature=test";

let storageRoot: string;

// The S3 backend would need bucket credentials; the local backend is reached
// through its own module and stays real.
const getSignedUrlDouble = vi.fn();
vi.mock("@/server/storage", () => ({
  createStorage: () => ({ getSignedUrl: getSignedUrlDouble }),
}));

vi.stubEnv("BETTER_AUTH_SECRET", "secret_characterization");
vi.stubEnv("BETTER_AUTH_URL", "https://app.test");
vi.stubEnv("STORAGE_BUCKET_NAME", BUCKET);
vi.stubEnv("STORAGE_PROVIDER", "local");

const { GET, PUT } = await import("./route");
const { createLocalStorageUrl } = await import("@/server/storage/local-url");

function storageRequest(key: string, init?: RequestInit, token?: string) {
  const url = new URL(`https://app.test/api/storage/${BUCKET}/${key}`);
  if (token) url.searchParams.set("token", token);
  return new Request(url, init);
}

function routeContext(key: string) {
  return { params: Promise.resolve({ path: [BUCKET, ...key.split("/")] }) };
}

function tokenOf(signedUrl: string) {
  return new URL(signedUrl).searchParams.get("token") ?? "";
}

async function writeObject(key: string, body: Buffer) {
  const path = join(storageRoot, BUCKET, key);
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, body);
}

beforeAll(async () => {
  storageRoot = await mkdtemp(join(tmpdir(), "storage-route-"));
  vi.stubEnv("STORAGE_LOCAL_PATH", storageRoot);
  await writeObject(AVATAR_KEY, PNG_BYTES);
  await writeObject(LOGO_KEY, PNG_BYTES);
  await writeObject(SCREENSHOT_KEY, PNG_BYTES);
});

afterEach(() => {
  vi.stubEnv("STORAGE_PROVIDER", "local");
  getSignedUrlDouble.mockReset();
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await rm(storageRoot, { recursive: true, force: true });
});

describe("GET /api/storage with the local provider", () => {
  it("serves a user avatar without a token", async () => {
    const response = await GET(
      storageRequest(AVATAR_KEY),
      routeContext(AVATAR_KEY),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(PNG_BYTES);
  });

  it("serves an organization logo without a token", async () => {
    const response = await GET(
      storageRequest(LOGO_KEY),
      routeContext(LOGO_KEY),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
  });

  it("refuses a screenshot without a token", async () => {
    const response = await GET(
      storageRequest(SCREENSHOT_KEY),
      routeContext(SCREENSHOT_KEY),
    );

    expect(response.status).toBe(403);
  });

  it("serves a screenshot with a signed token", async () => {
    const signedUrl = createLocalStorageUrl(
      { bucket: BUCKET, key: SCREENSHOT_KEY, method: "GET" },
      60,
    );

    const response = await GET(
      storageRequest(SCREENSHOT_KEY, undefined, tokenOf(signedUrl)),
      routeContext(SCREENSHOT_KEY),
    );

    expect(response.status).toBe(200);
  });

  it("refuses a screenshot with a token signed for another key", async () => {
    const signedUrl = createLocalStorageUrl(
      { bucket: BUCKET, key: AVATAR_KEY, method: "GET" },
      60,
    );

    const response = await GET(
      storageRequest(SCREENSHOT_KEY, undefined, tokenOf(signedUrl)),
      routeContext(SCREENSHOT_KEY),
    );

    expect(response.status).toBe(403);
  });

  it("returns 404 for a missing avatar", async () => {
    const key = "user-avatars/user_1/missing.png";

    const response = await GET(storageRequest(key), routeContext(key));

    expect(response.status).toBe(404);
  });

  it("returns 404 for an avatar with an unsupported extension", async () => {
    const key = "user-avatars/user_1/1700000000000.svg";
    await writeObject(key, PNG_BYTES);

    const response = await GET(storageRequest(key), routeContext(key));

    expect(response.status).toBe(404);
  });

  it("serves an image whole, ignoring a Range header", async () => {
    const response = await GET(
      storageRequest(AVATAR_KEY, { headers: { Range: "bytes=0-2" } }),
      routeContext(AVATAR_KEY),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("accept-ranges")).toBeNull();
    expect(Buffer.from(await response.arrayBuffer())).toEqual(PNG_BYTES);
  });

  it("refuses a PUT without a token", async () => {
    const response = await PUT(
      storageRequest(AVATAR_KEY, { method: "PUT", body: PNG_BYTES }),
      routeContext(AVATAR_KEY),
    );

    expect(response.status).toBe(403);
  });
});

describe("video on the local provider", () => {
  const VIDEO_KEY = "videos/project_1/video_1/source.mp4";
  // Distinct byte values so a misplaced slice cannot match by accident.
  const VIDEO_BYTES = Buffer.from(Array.from({ length: 200 }, (_, i) => i));

  beforeAll(() => writeObject(VIDEO_KEY, VIDEO_BYTES));

  function getVideo(headers?: HeadersInit) {
    const signedUrl = createLocalStorageUrl(
      { bucket: BUCKET, key: VIDEO_KEY, method: "GET" },
      60,
    );
    return GET(
      storageRequest(VIDEO_KEY, { headers }, tokenOf(signedUrl)),
      routeContext(VIDEO_KEY),
    );
  }

  function putVideo(
    key: string,
    size: number,
    body: ReadableStream<Uint8Array>,
  ) {
    const signedUrl = createLocalStorageUrl(
      { bucket: BUCKET, key, method: "PUT", contentType: "video/mp4", size },
      60,
    );
    return PUT(
      storageRequest(
        key,
        {
          method: "PUT",
          body,
          headers: {
            "Content-Type": "video/mp4",
            "Content-Length": String(size),
          },
          duplex: "half",
        } as RequestInit,
        tokenOf(signedUrl),
      ),
      routeContext(key),
    );
  }

  // Produces `size` bytes lazily, chunk by chunk, so the body never exists as
  // one buffer on the test side either.
  function patternStream(size: number, chunkSize = 1024 * 1024) {
    let sent = 0;
    return new ReadableStream<Uint8Array>({
      pull(controller) {
        if (sent >= size) {
          controller.close();
          return;
        }
        const length = Math.min(chunkSize, size - sent);
        const chunk = new Uint8Array(length);
        for (let i = 0; i < length; i++) chunk[i] = (sent + i) % 251;
        sent += length;
        controller.enqueue(chunk);
      },
    });
  }

  it("answers a Range request with 206 and the exact slice", async () => {
    const response = await getVideo({ Range: "bytes=10-19" });

    expect(response.status).toBe(206);
    expect(response.headers.get("content-type")).toBe("video/mp4");
    expect(response.headers.get("accept-ranges")).toBe("bytes");
    expect(response.headers.get("content-range")).toBe("bytes 10-19/200");
    expect(response.headers.get("content-length")).toBe("10");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(
      VIDEO_BYTES.subarray(10, 20),
    );
  });

  it("answers an open-ended range up to the last byte", async () => {
    const response = await getVideo({ Range: "bytes=150-" });

    expect(response.status).toBe(206);
    expect(response.headers.get("content-range")).toBe("bytes 150-199/200");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(
      VIDEO_BYTES.subarray(150),
    );
  });

  it("answers a suffix range with the last bytes", async () => {
    const response = await getVideo({ Range: "bytes=-5" });

    expect(response.status).toBe(206);
    expect(response.headers.get("content-range")).toBe("bytes 195-199/200");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(
      VIDEO_BYTES.subarray(195),
    );
  });

  it("answers 416 for a range past the end", async () => {
    const response = await getVideo({ Range: "bytes=200-" });

    expect(response.status).toBe(416);
    expect(response.headers.get("content-range")).toBe("bytes */200");
  });

  it("answers 200 with Accept-Ranges without a Range header", async () => {
    const response = await getVideo();

    expect(response.status).toBe(200);
    expect(response.headers.get("accept-ranges")).toBe("bytes");
    expect(response.headers.get("content-length")).toBe("200");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(VIDEO_BYTES);
  });

  it("serves a QuickTime file as video/quicktime", async () => {
    const key = "videos/project_1/video_2/source.mov";
    await writeObject(key, VIDEO_BYTES);
    const signedUrl = createLocalStorageUrl(
      { bucket: BUCKET, key, method: "GET" },
      60,
    );

    const response = await GET(
      storageRequest(
        key,
        { headers: { Range: "bytes=0-0" } },
        tokenOf(signedUrl),
      ),
      routeContext(key),
    );

    expect(response.status).toBe(206);
    expect(response.headers.get("content-type")).toBe("video/quicktime");
  });

  it("refuses a video without a token", async () => {
    const response = await GET(
      storageRequest(VIDEO_KEY, { headers: { Range: "bytes=0-1" } }),
      routeContext(VIDEO_KEY),
    );

    expect(response.status).toBe(403);
  });

  it("streams a large PUT to disk byte for byte", async () => {
    const key = "videos/project_1/video_3/source.mp4";
    const size = 64 * 1024 * 1024 + 7;

    const response = await putVideo(key, size, patternStream(size));

    expect(response.status).toBe(200);
    const stored = await readFile(join(storageRoot, BUCKET, key));
    expect(stored.length).toBe(size);
    expect(stored.equals(Buffer.from(await readAll(patternStream(size))))).toBe(
      true,
    );
  });

  it("refuses a PUT body shorter than declared and stores nothing", async () => {
    const key = "videos/project_1/video_4/source.mp4";

    const response = await putVideo(key, 2048, patternStream(1024));

    expect(response.status).toBe(400);
    await expect(
      readdir(join(storageRoot, BUCKET, "videos/project_1/video_4")),
    ).resolves.toEqual([]);
  });
});

async function readAll(stream: ReadableStream<Uint8Array>) {
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

describe("GET /api/storage with an S3 provider", () => {
  function useS3() {
    vi.stubEnv("STORAGE_PROVIDER", "s3");
    getSignedUrlDouble.mockResolvedValue(SIGNED_URL);
  }

  it("redirects a user avatar to a signed URL", async () => {
    useS3();

    const response = await GET(
      storageRequest(AVATAR_KEY),
      routeContext(AVATAR_KEY),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(SIGNED_URL);
    expect(response.headers.get("cache-control")).toBe("private, max-age=600");
    expect(getSignedUrlDouble).toHaveBeenCalledWith(
      { bucket: BUCKET, key: AVATAR_KEY },
      3600,
    );
  });

  it("redirects an organization logo to a signed URL", async () => {
    useS3();

    const response = await GET(
      storageRequest(LOGO_KEY),
      routeContext(LOGO_KEY),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(SIGNED_URL);
  });

  it("never signs a screenshot", async () => {
    useS3();

    const response = await GET(
      storageRequest(SCREENSHOT_KEY),
      routeContext(SCREENSHOT_KEY),
    );

    expect(response.status).toBe(404);
    expect(getSignedUrlDouble).not.toHaveBeenCalled();
  });

  it("never signs an avatar with an unsupported extension", async () => {
    useS3();
    const key = "user-avatars/user_1/1700000000000.svg";

    const response = await GET(storageRequest(key), routeContext(key));

    expect(response.status).toBe(404);
    expect(getSignedUrlDouble).not.toHaveBeenCalled();
  });

  it("never signs for a bucket other than the configured one", async () => {
    useS3();
    const otherBucket = "other-bucket";

    const response = await GET(
      new Request(`https://app.test/api/storage/${otherBucket}/${AVATAR_KEY}`),
      {
        params: Promise.resolve({
          path: [otherBucket, ...AVATAR_KEY.split("/")],
        }),
      },
    );

    expect(response.status).toBe(404);
    expect(getSignedUrlDouble).not.toHaveBeenCalled();
  });

  it("refuses a PUT, uploads go straight to the bucket", async () => {
    useS3();

    const response = await PUT(
      storageRequest(AVATAR_KEY, { method: "PUT", body: PNG_BYTES }),
      routeContext(AVATAR_KEY),
    );

    expect(response.status).toBe(404);
    expect(getSignedUrlDouble).not.toHaveBeenCalled();
  });
});
