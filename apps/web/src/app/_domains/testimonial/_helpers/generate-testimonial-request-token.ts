import crypto from "crypto";

// The token alone opens the public form, so it carries 256 bits of entropy.
export function generateTestimonialRequestToken() {
  return crypto.randomBytes(32).toString("base64url");
}
