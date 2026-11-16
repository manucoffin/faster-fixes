import { createTokenCipher } from "@/utils/crypto/token-cipher";

// Trello keeps its own encryption key so rotating one Tracker's key never
// forces re-encrypting another's. See ADR 0003.
const cipher = createTokenCipher("TRELLO_TOKEN_ENCRYPTION_KEY");

export function encryptToken(plain: string): string {
  return cipher.encrypt(plain);
}
