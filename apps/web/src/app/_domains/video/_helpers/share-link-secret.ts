import { decryptWithKey, encryptWithKey } from "@/utils/crypto/aes-gcm";
import { requireEnv } from "@/utils/environment/require-env";
import { createHash, hkdfSync, randomBytes } from "node:crypto";

// The ADR-0003 cipher under a key derived from the auth secret, so the Share
// link needs no environment variable of its own. Rotating the auth secret
// leaves lookup by hash intact and only stops the dashboard displaying links.
function getShareLinkKey() {
  return Buffer.from(
    hkdfSync(
      "sha256",
      requireEnv("BETTER_AUTH_SECRET", process.env.BETTER_AUTH_SECRET),
      "",
      "fasterfixes:video-share-link",
      32,
    ),
  );
}

export function hashShareLinkSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function decryptShareLinkSecret(encrypted: string) {
  return decryptWithKey(encrypted, getShareLinkKey());
}

// The secret itself is only ever handed to the caller, never stored in clear.
export function generateShareLinkSecret() {
  const secret = randomBytes(32).toString("base64url");
  return {
    secret,
    hash: hashShareLinkSecret(secret),
    encrypted: encryptWithKey(secret, getShareLinkKey()),
  };
}
