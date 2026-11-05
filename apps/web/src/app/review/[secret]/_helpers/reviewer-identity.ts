import { z } from "zod";

/**
 * The Reviewer identity a browser holds for one Video: the claimed name, the
 * secret it proves itself with and the Reviewer id the server gave back. Kept
 * without expiry; clearing storage means claiming a new name.
 */
const ReviewerIdentitySchema = z.object({
  name: z.string(),
  secret: z.string(),
  reviewerId: z.string(),
});

export type ReviewerIdentity = z.infer<typeof ReviewerIdentitySchema>;

type IdentityStorage = Pick<Storage, "getItem" | "setItem">;

const SECRET_BYTES = 24;

export function getReviewerIdentityKey(videoId: string) {
  return `fasterfixes:video-reviewer:${videoId}`;
}

/** The identity stored for the Video, or null when absent or unreadable. */
export function readReviewerIdentity(
  storage: IdentityStorage,
  videoId: string,
): ReviewerIdentity | null {
  const stored = storage.getItem(getReviewerIdentityKey(videoId));
  if (!stored) return null;

  try {
    const parsed = ReviewerIdentitySchema.safeParse(JSON.parse(stored));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeReviewerIdentity(
  storage: IdentityStorage,
  videoId: string,
  identity: ReviewerIdentity,
) {
  storage.setItem(getReviewerIdentityKey(videoId), JSON.stringify(identity));
}

/** 24 random bytes, base64url-encoded: the secret a new Reviewer claims with. */
export function generateReviewerSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(SECRET_BYTES));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
