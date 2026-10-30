import { BadRequestError } from "@/server/errors/domain-errors";
import { copyStorageObject, putStorageObject } from "@/server/storage/objects";

import { getTestimonialPhotoKey } from "../_helpers/testimonial-photo-keys";

// The same limits as the avatar and testimonial photo uploads.
const PHOTO_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/webp": "webp",
};
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

const PHOTO_FAILED_MESSAGE =
  "Your photo could not be saved. Remove it or upload another one.";

// `User.image` is writable by its owner, so a provider URL is fetched only
// over https, from a hostname, without following redirects.
function parseProviderPhotoUrl(image: string) {
  const url = URL.parse(image);
  if (!url || url.protocol !== "https:") return null;
  const { hostname } = url;
  if (
    hostname === "localhost" ||
    hostname.startsWith("[") ||
    /^[\d.]+$/.test(hostname) ||
    !hostname.includes(".")
  ) {
    return null;
  }
  return url;
}

async function fetchProviderPhoto(image: string) {
  const url = parseProviderPhotoUrl(image);
  if (!url) return null;

  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(5000),
  }).catch(() => null);
  if (!response?.ok) return null;

  const contentType = response.headers.get("content-type")?.split(";")[0];
  const extension = contentType ? PHOTO_TYPES[contentType] : undefined;
  if (!contentType || !extension) return null;

  const body = Buffer.from(await response.arrayBuffer());
  if (body.byteLength > MAX_PHOTO_BYTES) return null;

  return { body, contentType, extension };
}

/**
 * Copies the image chosen on the form to a Testimonial-owned key and returns
 * that key, so a later avatar change, which deletes the avatar object, never
 * breaks a published quote. `image` is a bucket key or a provider avatar URL.
 */
export async function createTestimonialPhoto({
  requestId,
  image,
  now,
}: {
  requestId: string;
  image: string;
  now: Date;
}) {
  if (image.startsWith("http")) {
    const photo = await fetchProviderPhoto(image);
    if (!photo) throw new BadRequestError(PHOTO_FAILED_MESSAGE);

    const key = getTestimonialPhotoKey(requestId, photo.extension, now);
    await putStorageObject({
      key,
      body: photo.body,
      contentType: photo.contentType,
    }).catch((error: unknown) => {
      console.error("Failed to store the Testimonial photo", {
        requestId,
        error,
      });
      throw new BadRequestError(PHOTO_FAILED_MESSAGE);
    });
    return key;
  }

  const extension = /\.(png|jpeg|jpg|webp)$/.exec(image)?.[1] ?? "png";
  const key = getTestimonialPhotoKey(requestId, extension, now);
  await copyStorageObject({ sourceKey: image, destinationKey: key }).catch(
    (error: unknown) => {
      console.error("Failed to copy the Testimonial photo", {
        requestId,
        error,
      });
      throw new BadRequestError(PHOTO_FAILED_MESSAGE);
    },
  );
  return key;
}
