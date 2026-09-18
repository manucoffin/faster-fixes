import { NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";

const { getCurrentEmail } = await import("./get-current-email");

function fakeDb(user: { email: string; emailVerified: boolean } | null) {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue(user),
    },
  } as unknown as NonNullable<Parameters<typeof getCurrentEmail>[1]>;
}

describe("getCurrentEmail", () => {
  it("reports an unknown User as a not found domain error", async () => {
    await expect(
      getCurrentEmail({ userId: "absent" }, fakeDb(null)),
    ).rejects.toThrow(new NotFoundError("User not found"));
  });

  it("returns the address and its verification state", async () => {
    await expect(
      getCurrentEmail(
        { userId: "user_1" },
        fakeDb({ email: "user@example.com", emailVerified: true }),
      ),
    ).resolves.toEqual({
      currentEmail: "user@example.com",
      emailVerified: true,
    });
  });
});
