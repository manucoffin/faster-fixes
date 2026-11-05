import { createHash } from "node:crypto";

// The browser-held Reviewer secret is stored as its SHA-256 hex, like the
// Widget's Reviewer token.
export function hashReviewerSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}
