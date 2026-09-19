import {
  BadRequestError,
  PreconditionFailedError,
} from "@/server/errors/domain-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signInEmailApi = vi.fn();

vi.mock("@/server/auth", () => ({
  auth: { api: { signInEmail: signInEmailApi } },
}));

const { signInUser } = await import("./sign-in-user");

const credentials = { email: "someone@example.com", password: "secret" };

describe("signInUser", () => {
  beforeEach(() => {
    signInEmailApi.mockReset();
  });

  it("reports a rejected password as a bad request, not a missing session", async () => {
    signInEmailApi.mockRejectedValue(new Error("Invalid email or password"));

    await expect(signInUser(credentials)).rejects.toThrow(
      new BadRequestError("Invalid email or password"),
    );
    await expect(signInUser(credentials)).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });

  it("reports an unverified email as a precondition failure with real copy", async () => {
    signInEmailApi.mockRejectedValue(new Error("Email not verified"));

    await expect(signInUser(credentials)).rejects.toThrow(
      new PreconditionFailedError(
        "Verify your email address before signing in.",
      ),
    );
    await expect(signInUser(credentials)).rejects.toBeInstanceOf(
      PreconditionFailedError,
    );
  });

  it("lets an unexpected failure propagate untranslated", async () => {
    const outage = new Error("Postgres is unreachable");
    signInEmailApi.mockRejectedValue(outage);

    await expect(signInUser(credentials)).rejects.toBe(outage);
  });

  it("returns the signed-in user", async () => {
    const user = { id: "user_1", email: credentials.email };
    signInEmailApi.mockResolvedValue({ user });

    await expect(signInUser(credentials)).resolves.toBe(user);
    expect(signInEmailApi).toHaveBeenCalledWith({ body: credentials });
  });
});
