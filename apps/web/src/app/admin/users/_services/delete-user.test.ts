import { NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";

const { deleteUser } = await import("./delete-user");

function fakeDb(user: { id: string } | null) {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue(user),
      delete: vi
        .fn()
        .mockResolvedValue({ id: "user_1", email: "gone@example.com" }),
    },
  } as unknown as NonNullable<Parameters<typeof deleteUser>[1]>;
}

describe("deleteUser", () => {
  it("reports an unknown User as a not found domain error", async () => {
    await expect(
      deleteUser({ userId: "absent" }, fakeDb(null)),
    ).rejects.toThrow(new NotFoundError("User not found"));
  });

  it("returns the deleted identifiers", async () => {
    await expect(
      deleteUser({ userId: "user_1" }, fakeDb({ id: "user_1" })),
    ).resolves.toEqual({
      success: true,
      user: { id: "user_1", email: "gone@example.com" },
    });
  });
});
