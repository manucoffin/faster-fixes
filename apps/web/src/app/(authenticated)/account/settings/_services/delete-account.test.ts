import { BadRequestError } from "@/server/errors/domain-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteUser = vi.fn();

vi.mock("@/server/auth", () => ({
  auth: { api: { deleteUser } },
}));

const { deleteAccount } = await import("./delete-account");

const input = { password: "s3cret", headers: new Headers() };

describe("deleteAccount", () => {
  beforeEach(() => {
    deleteUser.mockReset();
  });

  it("asks a social account holder to contact support", async () => {
    deleteUser.mockRejectedValue(new Error("OAuth accounts cannot be removed"));

    await expect(deleteAccount(input)).rejects.toThrow(
      new BadRequestError("Please contact support to delete your account."),
    );
  });

  it("lets an identity failure through for the procedure to answer", async () => {
    // The message mentions both a provider and a password: the original chain
    // answered the password first, and so does this one.
    const identityFailure = new Error("Invalid password for this provider");
    deleteUser.mockRejectedValue(identityFailure);

    await expect(deleteAccount(input)).rejects.toBe(identityFailure);
  });

  it("lets an unexpected failure propagate untranslated", async () => {
    const outage = new Error("the database is unreachable");
    deleteUser.mockRejectedValue(outage);

    await expect(deleteAccount(input)).rejects.toBe(outage);
  });

  it("deletes the account with the presented password", async () => {
    deleteUser.mockResolvedValue({ success: true });

    await expect(deleteAccount(input)).resolves.toEqual({ success: true });
    expect(deleteUser).toHaveBeenCalledWith({
      body: { password: "s3cret" },
      headers: input.headers,
    });
  });
});
