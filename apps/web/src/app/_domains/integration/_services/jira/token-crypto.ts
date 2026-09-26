import { createTokenCipher } from "@/utils/crypto/token-cipher";

// Jira keeps its own encryption key so rotating one Tracker's key never forces
// re-encrypting another's. See ADR 0003.
const cipher = createTokenCipher("JIRA_TOKEN_ENCRYPTION_KEY");

export function encryptToken(plain: string): string {
  return cipher.encrypt(plain);
}

export function decryptToken(payload: string): string {
  return cipher.decrypt(payload);
}
