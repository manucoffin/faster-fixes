import { ConflictError } from "@/server/errors/domain-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signUpEmail = vi.fn();

vi.mock("@/server/auth", () => ({
  auth: { api: { signUpEmail } },
}));

const { createUser } = await import("./create-user");

const profileUpsert = vi.fn();
const db = {
  profile: { upsert: profileUpsert },
} as unknown as NonNullable<Parameters<typeof createUser>[1]>;

const input = { email: "new@example.com", name: "New Admin" };

describe("createUser", () => {
  beforeEach(() => {
    signUpEmail.mockReset();
  });

  it("reports a taken address as a conflict domain error", async () => {
    signUpEmail.mockRejectedValue(new Error("email already exists"));

    await expect(createUser(input, db)).rejects.toThrow(
      new ConflictError("This email is already registered"),
    );
  });

  it("lets an unexpected failure propagate untranslated", async () => {
    const outage = new Error("the database is unreachable");
    signUpEmail.mockRejectedValue(outage);

    await expect(createUser(input, db)).rejects.toBe(outage);
  });

  it("returns the created account without touching the profile table", async () => {
    signUpEmail.mockResolvedValue({
      user: { id: "user_1", email: input.email, name: input.name },
    });

    await expect(createUser(input, db)).resolves.toEqual({
      userId: "user_1",
      email: input.email,
      name: input.name,
    });
    expect(profileUpsert).not.toHaveBeenCalled();
  });
});
