import { BadRequestError } from "@/server/errors/domain-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const changePassword = vi.fn();

vi.mock("@/server/auth", () => ({
  auth: { api: { changePassword } },
}));

const { updatePassword } = await import("./update-password");

const input = {
  currentPassword: "s3cret",
  newPassword: "An0ther-secret",
  headers: new Headers(),
};

describe("updatePassword", () => {
  beforeEach(() => {
    changePassword.mockReset();
  });

  it("reports a rejected current password as a bad request, not a missing session", async () => {
    changePassword.mockRejectedValue(new Error("Invalid password"));

    await expect(updatePassword(input)).rejects.toThrow(
      new BadRequestError("Current password is incorrect."),
    );
    await expect(updatePassword(input)).rejects.toBeInstanceOf(BadRequestError);
  });

  it("lets an unexpected failure propagate untranslated", async () => {
    const outage = new Error("the database is unreachable");
    changePassword.mockRejectedValue(outage);

    await expect(updatePassword(input)).rejects.toBe(outage);
  });

  it("changes the password and revokes the other sessions", async () => {
    changePassword.mockResolvedValue({});

    await expect(updatePassword(input)).resolves.toEqual({ success: true });
    expect(changePassword).toHaveBeenCalledWith({
      body: {
        currentPassword: "s3cret",
        newPassword: "An0ther-secret",
        revokeOtherSessions: true,
      },
      headers: input.headers,
    });
  });
});
