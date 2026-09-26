import type { Mailer } from "@/lib/mailer/client";
import { PreconditionFailedError } from "@/server/errors/domain-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn<Mailer["emails"]["send"]>();

// The real client imports `server-only` and builds a provider from the
// environment, neither of which a node test can load.
vi.mock("@/lib/mailer/client", () => ({ mailer: { emails: { send } } }));
vi.mock("@workspace/db", () => ({ prisma: {} }));

const { sendFeedback } = await import("./send-feedback");

function databaseWithAdmins(emails: (string | null)[]) {
  return {
    user: { findMany: async () => emails.map((email) => ({ email })) },
  } as unknown as Parameters<typeof sendFeedback>[1];
}

const sender = { senderName: "Ada", senderEmail: "ada@example.com" };

describe("sendFeedback", () => {
  beforeEach(() => {
    send.mockReset();
    send.mockResolvedValue({ success: true, message: "" });
  });

  it("reports an instance with no administrator as a precondition failure", async () => {
    await expect(
      sendFeedback({ message: "Hello", ...sender }, databaseWithAdmins([])),
    ).rejects.toThrow(
      new PreconditionFailedError(
        "No administrator found to receive feedback.",
      ),
    );

    expect(send).not.toHaveBeenCalled();
  });

  it("treats administrators without an address as no administrator at all", async () => {
    await expect(
      sendFeedback({ message: "Hello", ...sender }, databaseWithAdmins([null])),
    ).rejects.toBeInstanceOf(PreconditionFailedError);
  });

  it("mails every administrator once and names the sender", async () => {
    await expect(
      sendFeedback(
        { message: "Hello", ...sender },
        databaseWithAdmins(["one@example.com", "two@example.com"]),
      ),
    ).resolves.toEqual({ success: true });

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls.map(([options]) => options.to)).toEqual([
      "one@example.com",
      "two@example.com",
    ]);
    expect(send.mock.calls[0]?.[0].subject).toBe("Feedback from Ada");
    expect(send.mock.calls[0]?.[0].body).toContain("ada@example.com");
  });

  it("falls back to the address, then to a placeholder, when the session has no name", async () => {
    await sendFeedback(
      { message: "Hello", senderName: null, senderEmail: "ada@example.com" },
      databaseWithAdmins(["one@example.com"]),
    );
    expect(send.mock.calls[0]?.[0].subject).toBe(
      "Feedback from ada@example.com",
    );

    send.mockClear();
    await sendFeedback(
      { message: "Hello", senderName: null, senderEmail: null },
      databaseWithAdmins(["one@example.com"]),
    );
    expect(send.mock.calls[0]?.[0].subject).toBe("Feedback from Unknown user");
  });
});
