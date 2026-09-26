import { createTokenCipher } from "@/utils/crypto/token-cipher";

const cipher = createTokenCipher("LINEAR_TOKEN_ENCRYPTION_KEY");

export function encryptToken(plain: string): string {
  return cipher.encrypt(plain);
}

export function decryptToken(payload: string): string {
  return cipher.decrypt(payload);
}
