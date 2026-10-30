import "server-only";

import { createStorage } from "@/server/storage";
import { getStorageBucket } from "./config";

export async function putStorageObject({
  key,
  body,
  contentType,
}: {
  key: string;
  body: Buffer<ArrayBuffer>;
  contentType: string;
}) {
  return createStorage().put({
    bucket: getStorageBucket(),
    key,
    body,
    contentType,
  });
}

export async function copyStorageObject({
  sourceKey,
  destinationKey,
}: {
  sourceKey: string;
  destinationKey: string;
}) {
  const bucket = getStorageBucket();
  return createStorage().copy(
    { bucket, key: sourceKey },
    { bucket, key: destinationKey },
  );
}

export async function deleteStorageObject({ key }: { key: string }) {
  return createStorage().delete({ bucket: getStorageBucket(), key });
}

export async function deleteStorageObjects(keys: string[]) {
  return createStorage().deleteMany(getStorageBucket(), keys);
}

export function getStorageObjectUrl(
  { key }: { key: string },
  expiresIn = 3600,
) {
  return createStorage().getSignedUrl(
    { bucket: getStorageBucket(), key },
    expiresIn,
  );
}
