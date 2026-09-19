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

  it("reports a rejected password as a bad request, not a missing session", async () => {
    deleteUser.mockRejectedValue(new Error("Invalid password"));

    await expect(deleteAccount(input)).rejects.toThrow(
      new BadRequestError("Password is incorrect."),
    );
    await expect(deleteAccount(input)).rejects.toBeInstanceOf(BadRequestError);
  });

  it("asks a social account holder to contact support", async () => {
    deleteUser.mockRejectedValue(new Error("OAuth accounts cannot be removed"));

    await expect(deleteAccount(input)).rejects.toThrow(
      new BadRequestError("Please contact support to delete your account."),
    );
  });

  it("answers a password first when the message names a provider too", async () => {
    // The original chain answered the password before the provider, and so
    // does this one.
    deleteUser.mockRejectedValue(
      new Error("Invalid password for this provider"),
    );

    await expect(deleteAccount(input)).rejects.toThrow(
      new BadRequestError("Password is incorrect."),
    );
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
