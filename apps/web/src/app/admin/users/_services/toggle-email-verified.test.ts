import { NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";

const { toggleEmailVerified } = await import("./toggle-email-verified");

function fakeDb(user: { id: string } | null) {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue(user),
      update: vi.fn().mockResolvedValue({
        id: "user_1",
        email: "user@example.com",
        emailVerified: true,
      }),
    },
  } as unknown as NonNullable<Parameters<typeof toggleEmailVerified>[1]>;
}

describe("toggleEmailVerified", () => {
  it("reports an unknown User as a not found domain error", async () => {
    await expect(
      toggleEmailVerified(
        { userId: "absent", emailVerified: true },
        fakeDb(null),
      ),
    ).rejects.toThrow(new NotFoundError("User not found"));
  });

  it("returns the User with its new verification state", async () => {
    await expect(
      toggleEmailVerified(
        { userId: "user_1", emailVerified: true },
        fakeDb({ id: "user_1" }),
      ),
    ).resolves.toEqual({
      id: "user_1",
      email: "user@example.com",
      emailVerified: true,
    });
  });
});
