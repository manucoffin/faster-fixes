import { BadRequestError } from "@/server/errors/domain-errors";
import { getStorageBucket, getStorageProvider } from "@/server/storage/config";
import { LocalStorage } from "@/server/storage/local";
import { verifyLocalStorageAccess } from "@/server/storage/local-url";
import { getStorageObjectUrl } from "@/server/storage/objects";
import type { ReadableStream as WebReadableStream } from "node:stream/web";

type Context = { params: Promise<{ path: string[] }> };
const contentTypes: Record<string, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  webp: "image/webp",
  mp4: "video/mp4",
  mov: "video/quicktime",
};
const servedHeaders = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'",
  "Access-Control-Allow-Origin": "*",
};

// A syntactically invalid or multi-part Range is ignored and the whole object
// served, as RFC 9110 allows; only a well-formed range past the end is refused.
function parseByteRange(header: string | null, size: number) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header?.trim() ?? "");
  if (!match || (!match[1] && !match[2])) return null;
  const [, first = "", last = ""] = match;
  if (!first) {
    const suffix = Number(last);
    if (suffix === 0 || size === 0) return "unsatisfiable";
    return { start: Math.max(size - suffix, 0), end: size - 1 };
  }
  const start = Number(first);
  if (last && Number(last) < start) return null;
  if (start >= size) return "unsatisfiable";
  return {
    start,
    end: last ? Math.min(Number(last), size - 1) : size - 1,
  };
}

async function serveVideo(
  req: Request,
  storage: LocalStorage,
  object: { bucket: string; key: string; contentType: string },
) {
  const info = await storage.head(object);
  if (!info) return new Response(null, { status: 404 });
  const headers = {
    ...servedHeaders,
    "Content-Type": object.contentType,
    "Accept-Ranges": "bytes",
  };
  const range = parseByteRange(req.headers.get("range"), info.size);
  if (range === "unsatisfiable") {
    return new Response(null, {
      status: 416,
      headers: { ...headers, "Content-Range": `bytes */${info.size}` },
    });
  }
  const { start, end } = range ?? { start: 0, end: info.size - 1 };
  return new Response(
    info.size === 0
      ? null
      : (storage.readRange(object.bucket, object.key, {
          start,
          end,
        }) as ReadableStream<Uint8Array>),
    {
      status: range ? 206 : 200,
      headers: {
        ...headers,
        "Content-Length": String(end - start + 1),
        ...(range && { "Content-Range": `bytes ${start}-${end}/${info.size}` }),
      },
    },
  );
}

// A key changes on every new upload, so a cached redirect never shows a stale
// image; the signed URL outlives the cache so a cached redirect still resolves.
const SIGNED_URL_EXPIRES_IN = 3600;
const REDIRECT_MAX_AGE = 600;

// Avatar and logo keys are the only ones readable without a token. Everything
// else (screenshots) is reached through a signed URL only.
function isPublicImageKey(key: string) {
  return /^(user-avatars|organization-logos)\//.test(key);
}

async function storageRequest(req: Request, { params }: Context) {
  const [bucket = "", ...parts] = (await params).path;
  const key = parts.join("/");
  const publicImage = req.method === "GET" && isPublicImageKey(key);
  const contentType = contentTypes[key.split(".").at(-1) ?? ""];

  if (getStorageProvider() !== "local") {
    // Uploads go straight to the bucket. Only avatar and logo reads pass
    // through here, so a private bucket needs no public base URL.
    if (!publicImage || !contentType || bucket !== getStorageBucket()) {
      return new Response(null, { status: 404 });
    }
    return new Response(null, {
      status: 302,
      headers: {
        Location: await getStorageObjectUrl({ key }, SIGNED_URL_EXPIRES_IN),
        "Cache-Control": `private, max-age=${REDIRECT_MAX_AGE}`,
      },
    });
  }

  const access = verifyLocalStorageAccess(
    new URL(req.url).searchParams.get("token"),
    {
      method: req.method,
      bucket,
      key,
    },
  );
  if (!access && !publicImage) return new Response(null, { status: 403 });
  const storage = new LocalStorage();
  try {
    if (req.method === "PUT") {
      if (
        access?.method !== "PUT" ||
        req.headers.get("content-type") !== access.contentType ||
        req.headers.get("content-length") !== String(access.size)
      ) {
        return new Response(null, { status: 400 });
      }
      // Streamed so a video of several hundred megabytes is never held in memory.
      await storage.write(
        { bucket, key, size: access.size },
        req.body as WebReadableStream<Uint8Array> | null,
      );
      // Better Upload's client treats any status but 200 as a failed upload.
      return new Response(null, { status: 200 });
    }
    if (!contentType) return new Response(null, { status: 404 });
    if (contentType.startsWith("video/")) {
      return await serveVideo(req, storage, { bucket, key, contentType });
    }
    return new Response(await storage.read(bucket, key), {
      headers: { ...servedHeaders, "Content-Type": contentType },
    });
  } catch (error) {
    if (error instanceof BadRequestError) {
      return new Response(error.message, { status: 400 });
    }
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return new Response(null, { status: 404 });
    }
    throw error;
  }
}

export const GET = storageRequest;
export const PUT = storageRequest;
