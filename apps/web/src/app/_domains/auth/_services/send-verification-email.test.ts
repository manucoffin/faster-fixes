import { NotFoundError } from "@/server/errors/domain-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sendVerificationEmailApi = vi.fn();

vi.mock("@/server/auth", () => ({
  auth: { api: { sendVerificationEmail: sendVerificationEmailApi } },
}));

const { sendVerificationEmail } = await import("./send-verification-email");

const headers = new Headers();

describe("sendVerificationEmail", () => {
  beforeEach(() => {
    sendVerificationEmailApi.mockReset();
  });

  it("reports an unknown account as a not found domain error", async () => {
    sendVerificationEmailApi.mockRejectedValue(
      new Error("User not found. Please sign up first."),
    );

    await expect(
      sendVerificationEmail({ email: "absent@example.com", headers }),
    ).rejects.toThrow(new NotFoundError("This user does not exist."));
  });

  it("reports the 404 shape Better Auth throws as the same domain error", async () => {
    sendVerificationEmailApi.mockRejectedValue({ statusCode: 404 });

    await expect(
      sendVerificationEmail({ email: "absent@example.com", headers }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("lets an unexpected failure propagate untranslated", async () => {
    const outage = new Error("Resend is unreachable");
    sendVerificationEmailApi.mockRejectedValue(outage);

    await expect(
      sendVerificationEmail({ email: "someone@example.com", headers }),
    ).rejects.toBe(outage);
  });

  it("normalises the address before asking Better Auth to send", async () => {
    sendVerificationEmailApi.mockResolvedValue(undefined);

    await expect(
      sendVerificationEmail({ email: "  Someone@Example.com ", headers }),
    ).resolves.toEqual({
      success: true,
      message: "Verification email sent successfully.",
    });
    expect(sendVerificationEmailApi).toHaveBeenCalledWith({
      body: { email: "someone@example.com" },
      headers,
    });
  });
});
