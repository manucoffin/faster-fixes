import { NotFoundError } from "@/server/errors/domain-errors";
import { TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";
import type { Context } from "./context";
import { logTRPCError } from "./log-trpc-error";
import { publicProcedure, router } from "./trpc";

let consoleError: MockInstance<typeof console.error>;

beforeEach(() => {
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function loggedArguments() {
  expect(consoleError).toHaveBeenCalledTimes(1);
  return consoleError.mock.calls[0] as unknown[];
}

describe("logTRPCError", () => {
  it("names the failing procedure and its code on the logged line", () => {
    logTRPCError({
      error: new TRPCError({ code: "NOT_FOUND", message: "Project not found" }),
      path: "project.byId",
      type: "query",
    });

    expect(loggedArguments()[0]).toBe(
      "tRPC query project.byId failed with NOT_FOUND",
    );
  });

  it("logs the whole cause chain, not only the transport error", () => {
    const atlassianFailure = new Error("Atlassian answered 503");
    const domainError = new NotFoundError("Feedback not found", {
      cause: atlassianFailure,
    });
    const transportError = new TRPCError({
      code: "NOT_FOUND",
      message: domainError.message,
      cause: domainError,
    });

    logTRPCError({
      error: transportError,
      path: "feedback.update",
      type: "mutation",
    });

    expect(loggedArguments()).toEqual([
      "tRPC mutation feedback.update failed with NOT_FOUND",
      transportError,
      domainError,
      atlassianFailure,
    ]);
  });

  it("logs a failure with no cause as the error alone", () => {
    const error = new TRPCError({ code: "UNAUTHORIZED" });

    logTRPCError({ error, path: undefined, type: "unknown" });

    expect(loggedArguments()).toEqual([
      "tRPC unknown <unknown path> failed with UNAUTHORIZED",
      error,
    ]);
  });

  it("stops on a cause chain that points back at itself", () => {
    const outer = new Error("Outer");
    const inner = new Error("Inner");
    inner.cause = outer;
    outer.cause = inner;
    const error = new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      cause: outer,
    });

    logTRPCError({ error, path: "loop", type: "query" });

    expect(loggedArguments()).toEqual([
      "tRPC query loop failed with INTERNAL_SERVER_ERROR",
      error,
      outer,
      inner,
    ]);
  });
});

// The hook is only worth exporting if tRPC accepts it and hands it the error a
// procedure actually threw, so it is driven through the same fetch adapter the
// route handler uses rather than called with a hand-built report.
const testRouter = router({
  boom: publicProcedure.query(() => {
    throw new Error("Prisma connection refused");
  }),
});

describe("logTRPCError mounted as the handler's onError", () => {
  it("receives the error the procedure threw, with its transport wrapper", async () => {
    await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: new Request("http://test/api/trpc/boom"),
      router: testRouter,
      createContext: () => ({}) as Context,
      onError: logTRPCError,
    });

    const [line, transportError, cause] = loggedArguments();

    expect(line).toBe("tRPC query boom failed with INTERNAL_SERVER_ERROR");
    expect(transportError).toBeInstanceOf(TRPCError);
    expect(cause).toBeInstanceOf(Error);
    expect((cause as Error).message).toBe("Prisma connection refused");
  });
});
