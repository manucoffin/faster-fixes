import {
  decryptWithKey,
  encryptWithKey,
  loadHexKeyFromEnv,
} from "@/utils/crypto/aes-gcm";

const key = loadHexKeyFromEnv("SLACK_TOKEN_ENCRYPTION_KEY");

export function encryptSlackToken(plain: string): string {
  return encryptWithKey(plain, key);
}

export function decryptSlackToken(payload: string): string {
  return decryptWithKey(payload, key);
}
