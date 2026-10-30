import "server-only";

import { aws, cloudflare, custom } from "@better-upload/server/clients";
import {
  copyObject,
  deleteObject,
  deleteObjects,
  presignGetObject,
  putObject,
} from "@better-upload/server/helpers";
import { getStorageRegion } from "./config";
import type { StorageBackend, StorageObject } from "./types";

function createS3Client(provider: "s3" | "r2") {
  if (provider === "r2") {
    return cloudflare({
      accountId: process.env.R2_ACCOUNT_ID ?? "",
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    });
  }
  const credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    region: getStorageRegion(),
  };
  const endpoint = process.env.STORAGE_ENDPOINT;
  if (!endpoint) return aws(credentials);
  const url = new URL(endpoint);
  return custom({
    ...credentials,
    host: url.host,
    secure: url.protocol === "https:",
    forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE !== "false",
  });
}

export class S3Storage implements StorageBackend {
  private cachedClient: ReturnType<typeof createS3Client> | undefined;

  constructor(private provider: "s3" | "r2") {}

  // Credentials are resolved on first use, so builds need no storage account.
  get uploadClient() {
    return (this.cachedClient ??= createS3Client(this.provider));
  }

  put(object: Parameters<StorageBackend["put"]>[0]) {
    return putObject(this.uploadClient, object);
  }

  copy(source: StorageObject, destination: StorageObject) {
    return copyObject(this.uploadClient, { source, destination });
  }

  delete(object: StorageObject) {
    return deleteObject(this.uploadClient, object);
  }

  deleteMany(bucket: string, keys: string[]) {
    return deleteObjects(this.uploadClient, {
      bucket,
      objects: keys.map((key) => ({ key })),
      quiet: true,
    });
  }

  getSignedUrl(object: StorageObject, expiresIn: number) {
    return presignGetObject(this.uploadClient, { ...object, expiresIn });
  }
}
