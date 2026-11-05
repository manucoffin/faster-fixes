import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  decryptShareLinkSecret,
  generateShareLinkSecret,
  hashShareLinkSecret,
} from "./share-link-secret";

describe("generateShareLinkSecret", () => {
  beforeEach(() => {
    vi.stubEnv("BETTER_AUTH_SECRET", "test-auth-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("generates 32 random bytes in base64url", () => {
    const { secret } = generateShareLinkSecret();

    expect(secret).toMatch(/^[\w-]{43}$/);
    expect(Buffer.from(secret, "base64url")).toHaveLength(32);
  });

  it("stores the SHA-256 hex of the secret as its hash", () => {
    const { secret, hash } = generateShareLinkSecret();

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashShareLinkSecret(secret)).toBe(hash);
  });

  it("encrypts the secret so it decrypts back to itself", () => {
    const { secret, encrypted } = generateShareLinkSecret();

    expect(encrypted).not.toContain(secret);
    expect(decryptShareLinkSecret(encrypted)).toBe(secret);
  });

  it("never generates the same secret twice", () => {
    const first = generateShareLinkSecret();
    const second = generateShareLinkSecret();

    expect(second.secret).not.toBe(first.secret);
    expect(second.hash).not.toBe(first.hash);
  });

  it("refuses to decrypt under a different auth secret", () => {
    const { encrypted } = generateShareLinkSecret();

    vi.stubEnv("BETTER_AUTH_SECRET", "another-auth-secret");
    expect(() => decryptShareLinkSecret(encrypted)).toThrow();
  });
});
