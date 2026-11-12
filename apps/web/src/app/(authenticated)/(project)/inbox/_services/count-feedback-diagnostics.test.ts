import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import { countFeedbackDiagnostics } from "./count-feedback-diagnostics";

type FakeDb = NonNullable<Parameters<typeof countFeedbackDiagnostics>[1]>;

const input = { feedbackId: "feedback_1", userId: "user_1" };

function network(status: number) {
  return { method: "GET", url: "/api", status, duration: 10, timestamp: 1 };
}

function fakeDb({
  diagnosticTrail = null as unknown,
  found = true,
  membership = { id: "member_1" } as { id: string } | null,
} = {}) {
  return {
    feedback: {
      findUnique: vi.fn(async () =>
        found
          ? { diagnosticTrail, project: { organizationId: "organization_1" } }
          : null,
      ),
    },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
  } as unknown as FakeDb;
}

describe("countFeedbackDiagnostics", () => {
  it("counts console errors and failed requests, a network error included", async () => {
    const db = fakeDb({
      diagnosticTrail: {
        console: [
          { level: "error", message: "a", timestamp: 1 },
          { level: "error", message: "b", timestamp: 2 },
          { level: "warn", message: "c", timestamp: 3 },
          { level: "log", message: "d", timestamp: 4 },
        ],
        network: [network(500), network(404), network(0), network(200)],
      },
    });

    await expect(countFeedbackDiagnostics(input, db)).resolves.toEqual({
      consoleErrors: 2,
      failedRequests: 3,
    });
  });

  it("counts nothing for other levels and successful requests", async () => {
    const db = fakeDb({
      diagnosticTrail: {
        console: [{ level: "info", message: "a", timestamp: 1 }],
        network: [network(204), network(302)],
      },
    });

    await expect(countFeedbackDiagnostics(input, db)).resolves.toEqual({
      consoleErrors: 0,
      failedRequests: 0,
    });
  });

  it("counts nothing for a Feedback without a Diagnostic Trail", async () => {
    await expect(countFeedbackDiagnostics(input, fakeDb())).resolves.toEqual({
      consoleErrors: 0,
      failedRequests: 0,
    });
  });

  it("refuses a non-Member", async () => {
    await expect(
      countFeedbackDiagnostics(input, fakeDb({ membership: null })),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("says a missing Feedback is not found", async () => {
    await expect(
      countFeedbackDiagnostics(input, fakeDb({ found: false })),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
