import "server-only";

import { BadRequestError } from "@/server/errors/domain-errors";
import { getAuthBaseUrl } from "@/utils/url/get-auth-base-url";
import {
  copyFile,
  mkdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";
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

  read(bucket: string, key: string) {
    return readFile(getLocalObjectPath(this.root, bucket, key));
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
