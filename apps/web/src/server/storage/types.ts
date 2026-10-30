import type { Router } from "@better-upload/server";

export type StorageObject = { bucket: string; key: string };

export type StorageBackend = {
  put(
    object: StorageObject & { body: Buffer<ArrayBuffer>; contentType: string },
  ): Promise<void>;
  copy(source: StorageObject, destination: StorageObject): Promise<void>;
  delete(object: StorageObject): Promise<void>;
  deleteMany(
    bucket: string,
    keys: string[],
  ): Promise<{
    errors: { key: string; code: string; message: string }[];
  }>;
  getSignedUrl(object: StorageObject, expiresIn: number): Promise<string>;
  uploadClient: Router["client"];
};
