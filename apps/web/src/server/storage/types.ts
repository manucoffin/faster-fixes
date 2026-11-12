import type { Router } from "@better-upload/server";

export type StorageObject = { bucket: string; key: string };

// What storage reports about a stored object, `null` when it is absent.
export type StoredObjectInfo = { size: number; contentType: string } | null;

export type StorageBackend = {
  put(
    object: StorageObject & { body: Buffer<ArrayBuffer>; contentType: string },
  ): Promise<void>;
  copy(source: StorageObject, destination: StorageObject): Promise<void>;
  delete(object: StorageObject): Promise<void>;
  head(object: StorageObject): Promise<StoredObjectInfo>;
  // The stored bytes, `null` when the object is absent.
  get(object: StorageObject): Promise<Buffer | null>;
  deleteMany(
    bucket: string,
    keys: string[],
  ): Promise<{
    errors: { key: string; code: string; message: string }[];
  }>;
  getSignedUrl(object: StorageObject, expiresIn: number): Promise<string>;
  uploadClient: Router["client"];
};
