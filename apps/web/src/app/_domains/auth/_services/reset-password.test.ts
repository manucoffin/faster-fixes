import { BadRequestError } from "@/server/errors/domain-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const resetPasswordApi = vi.fn();

vi.mock("@/server/auth", () => ({
  auth: { api: { resetPassword: resetPasswordApi } },
}));

const { resetPassword } = await import("./reset-password");

const input = {
  token: "reset_token",
  password: "new-secret",
  headers: new Headers(),
};

describe("resetPassword", () => {
  beforeEach(() => {
    resetPasswordApi.mockReset();
  });

  it("refuses a link with no token before calling Better Auth", async () => {
    await expect(resetPassword({ ...input, token: "" })).rejects.toThrow(
      new BadRequestError("Missing token. Invalid reset link."),
    );
    expect(resetPasswordApi).not.toHaveBeenCalled();
  });

  it("reports a rejected reset token as a bad request with final copy", async () => {
    resetPasswordApi.mockRejectedValue(new Error("Invalid token"));

    await expect(resetPassword(input)).rejects.toThrow(
      new BadRequestError("The reset link is invalid or has expired."),
    );
    await expect(resetPassword(input)).rejects.toBeInstanceOf(BadRequestError);
  });

  it("reports an expired reset token with the same copy", async () => {
    resetPasswordApi.mockRejectedValue(new Error("token has expired"));

    await expect(resetPassword(input)).rejects.toThrow(
      new BadRequestError("The reset link is invalid or has expired."),
    );
  });

  it("lets an unexpected failure propagate untranslated", async () => {
    const outage = new Error("Postgres is unreachable");
    resetPasswordApi.mockRejectedValue(outage);

    await expect(resetPassword(input)).rejects.toBe(outage);
  });

  it("returns what Better Auth answers on a successful reset", async () => {
    const result = { status: true };
    resetPasswordApi.mockResolvedValue(result);

    await expect(resetPassword(input)).resolves.toBe(result);
    expect(resetPasswordApi).toHaveBeenCalledWith({
      body: { newPassword: input.password, token: input.token },
      headers: input.headers,
    });
  });
});
