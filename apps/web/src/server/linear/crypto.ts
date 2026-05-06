import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const raw = process.env.LINEAR_TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "LINEAR_TOKEN_ENCRYPTION_KEY is not set. Generate one via `openssl rand -hex 32` and add it to .env.local.",
    );
  }
  const buf = Buffer.from(raw, "hex");
  if (buf.length !== 32) {
    throw new Error(
      "LINEAR_TOKEN_ENCRYPTION_KEY must decode to 32 bytes (64 hex characters).",
    );
  }
  return buf;
}

const key = getKey();

export function encryptToken(plain: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${ciphertext.toString("base64")}`;
}

export function decryptToken(payload: string): string {
  const [ivB64, authTagB64, ciphertextB64] = payload.split(":");
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error("Malformed encrypted payload.");
  }
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");
  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Encrypted payload has unexpected IV/authTag length.");
  }
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plain = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plain.toString("utf8");
}
