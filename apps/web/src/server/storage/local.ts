import "server-only";

import { BadRequestError } from "@/server/errors/domain-errors";
import { getAuthBaseUrl } from "@/utils/url/get-auth-base-url";
import { randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import {
  copyFile,
  mkdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import { getStorageBucket } from "./config";
import { createLocalStorageUrl } from "./local-url";
import type { StorageBackend, StorageObject } from "./types";

// Local disk keeps no content type, so it is read back from the key.
const contentTypesByExtension: Record<string, string> = {
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  mov: "video/quicktime",
  mp4: "video/mp4",
  png: "image/png",
  webp: "image/webp",
};

function getLocalObjectPath(root: string, bucket: string, key: string) {
  if (
    ![bucket, ...key.split("/")].every((part) => /^[\w-][\w.-]*$/.test(part))
  ) {
    throw new BadRequestError("Invalid storage path.");
  }
  return join(root, bucket, key);
}

export class LocalStorage implements StorageBackend {
  constructor(private root = process.env.STORAGE_LOCAL_PATH ?? "./storage") {}

  async put(object: Parameters<StorageBackend["put"]>[0]) {
    const path = getLocalObjectPath(this.root, object.bucket, object.key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, object.body);
  }

  // Streams the body to a temporary file renamed into place once it holds
  // exactly `size` bytes, so a short or oversized body never lands at the key.
  async write(
    object: StorageObject & { size: number },
    body: WebReadableStream<Uint8Array> | null,
  ) {
    const path = getLocalObjectPath(this.root, object.bucket, object.key);
    await mkdir(dirname(path), { recursive: true });
    const partPath = `${path}.${randomUUID()}.part`;
    let written = 0;
    const countBytes = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        written += chunk.length;
        if (written > object.size) {
          callback(new BadRequestError("Upload is larger than declared."));
          return;
        }
        callback(null, chunk);
      },
    });
    try {
      await pipeline(
        body ? Readable.fromWeb(body) : Readable.from([]),
        countBytes,
        createWriteStream(partPath),
      );
      if (written !== object.size) {
        throw new BadRequestError("Upload is smaller than declared.");
      }
      await rename(partPath, path);
    } catch (error) {
      await rm(partPath, { force: true });
      throw error;
    }
  }

  read(bucket: string, key: string) {
    return readFile(getLocalObjectPath(this.root, bucket, key));
  }

  // `end` is inclusive, as in an HTTP byte range.
  readRange(
    bucket: string,
    key: string,
    range: { start: number; end: number },
  ) {
    return Readable.toWeb(
      createReadStream(getLocalObjectPath(this.root, bucket, key), range),
    );
  }

  async copy(source: StorageObject, destination: StorageObject) {
    const path = getLocalObjectPath(
      this.root,
      destination.bucket,
      destination.key,
    );
    await mkdir(dirname(path), { recursive: true });
    await copyFile(
      getLocalObjectPath(this.root, source.bucket, source.key),
      path,
    );
  }

  delete(object: StorageObject) {
    return rm(getLocalObjectPath(this.root, object.bucket, object.key), {
      force: true,
    });
  }

  async head(object: StorageObject) {
    try {
      const { size } = await stat(
        getLocalObjectPath(this.root, object.bucket, object.key),
      );
      const extension = object.key.split(".").at(-1) ?? "";
      return { size, contentType: contentTypesByExtension[extension] ?? "" };
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return null;
      }
      throw error;
    }
  }

  async deleteMany(bucket: string, keys: string[]) {
    await Promise.all(keys.map((key) => this.delete({ bucket, key })));
    return { errors: [] };
  }

  getSignedUrl(object: StorageObject, expiresIn: number) {
    return Promise.resolve(
      createLocalStorageUrl({ ...object, method: "GET" }, expiresIn),
    );
  }

  get uploadClient(): StorageBackend["uploadClient"] {
    const bucket = getStorageBucket();
    return {
      buildBucketUrl: (bucket: string) =>
        new URL(`/api/storage/${bucket}`, getAuthBaseUrl()).href,
      s3: {
        sign: (input, init) => {
          const request = new Request(
            input instanceof Request ? input : input.toString(),
            init ?? undefined,
          );
          const url = new URL(request.url);
          const signedUrl = createLocalStorageUrl(
            {
              method: "PUT",
              bucket,
              key: url.pathname.slice(`/api/storage/${bucket}/`.length),
              contentType: request.headers.get("content-type") ?? "",
              size: Number(request.headers.get("content-length")),
            },
            Number(url.searchParams.get("X-Amz-Expires")),
          );
          return Promise.resolve(new Request(signedUrl));
        },
      },
      // Better Upload's non-multipart routes only use buildBucketUrl and s3.sign.
    } as StorageBackend["uploadClient"];
  }
}
