import {
  BadRequestError,
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  PreconditionFailedError,
} from "@/server/errors/domain-errors";
import { JiraReauthRequiredError } from "@/server/jira/errors";
import { TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { Context } from "./context";
import { createCallerFactory, publicProcedure, router } from "./trpc";

// One procedure throws whatever it is given, so a single router covers every
// failure mode the base procedure has to map.
const testRouter = router({
  fail: publicProcedure
    .input(z.object({ thrown: z.custom<unknown>() }))
    .query(({ input }) => {
      throw input.thrown;
    }),
  withInput: publicProcedure
    .input(z.object({ name: z.string(), age: z.number() }))
    .query(({ input }) => input.name),
  // A thrown error cannot cross the wire as input, so the transport test needs
  // a procedure that throws server-side.
  missing: publicProcedure.query(() => {
    throw new NotFoundError("Project not found");
  }),
  unexpected: publicProcedure.query(() => {
    throw new Error("Prisma connection refused at postgres://user:hunter2@db");
  }),
  jira: publicProcedure.query(() => {
    throw new JiraReauthRequiredError("jira_installation_1");
  }),
});

const caller = createCallerFactory(testRouter)({} as Context);

async function catchProcedureError(thrown: unknown) {
  try {
    await caller.fail({ thrown });
  } catch (error) {
    return error as TRPCError;
  }

  throw new Error("The procedure resolved instead of throwing");
}

const subclasses = [
  ["NOT_FOUND", new NotFoundError("Project not found")],
  ["CONFLICT", new ConflictError("This email is already taken")],
  ["BAD_REQUEST", new BadRequestError("The reviewer list is empty")],
  [
    "FORBIDDEN",
    new ForbiddenError("You are not a member of this Organization"),
  ],
  [
    "PRECONDITION_FAILED",
    new PreconditionFailedError("Link a GitHub repository first"),
  ],
] as const satisfies ReadonlyArray<readonly [string, DomainError]>;

describe("domain error mapping on the base procedure", () => {
  it.each(subclasses)(
    "surfaces a %s domain error with its code and message",
    async (code, domainError) => {
      const error = await catchProcedureError(domainError);

      expect(error).toBeInstanceOf(TRPCError);
      expect(error.code).toBe(code);
      expect(error.message).toBe(domainError.message);
      expect(error.cause).toBe(domainError);
    },
  );

  // A second-level subclass is what lets the five Jira screens answer with copy
  // instead of a 500, and it must map on the code it inherits, not on its own
  // name.
  it("surfaces a second-level subclass on the code it inherits", async () => {
    const jiraError = new JiraReauthRequiredError("jira_installation_1");

    const error = await catchProcedureError(jiraError);

    expect(error.code).toBe("PRECONDITION_FAILED");
    expect(error.message).toBe(
      "The Jira connection needs to be re-authorized.",
    );
    expect(error.cause).toBe(jiraError);
  });

  it("leaves a bare error as an internal server error", async () => {
    const bare = new Error("Prisma connection refused");

    const error = await catchProcedureError(bare);

    expect(error.code).toBe("INTERNAL_SERVER_ERROR");
    expect(error.cause).toBe(bare);
  });
});

// The error formatter runs at a transport adapter and never in a server-side
// caller, so the response shape is asserted through the same fetch handler the
// tRPC route uses.
async function fetchProcedure(path: string, input?: unknown) {
  const query =
    input === undefined
      ? ""
      : `?input=${encodeURIComponent(JSON.stringify({ json: input }))}`;
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: new Request(`http://test/api/trpc/${path}${query}`),
    router: testRouter,
    createContext: () => ({}) as Context,
  });

  return {
    status: response.status,
    body: (await response.json()) as {
      error: { json: { message: string; data: Record<string, unknown> } };
    },
  };
}

describe("the error formatter next to the mapping middleware", () => {
  it("keeps the field-level detail of a failed input validation", async () => {
    const { status, body } = await fetchProcedure("withInput", {
      name: 123,
      age: "not a number",
    });

    expect(status).toBe(400);
    expect(body.error.json.data.code).toBe("BAD_REQUEST");
    expect(body.error.json.data.zodError).toEqual({
      formErrors: [],
      fieldErrors: {
        name: ["Invalid input: expected string, received number"],
        age: ["Invalid input: expected number, received string"],
      },
    });
  });

  it("maps a domain error to its http status and leaves no zod detail", async () => {
    const { status, body } = await fetchProcedure("missing");

    expect(status).toBe(404);
    expect(body.error.json.message).toBe("Project not found");
    expect(body.error.json.data.zodError).toBeNull();
  });

  it("masks the message of an unexpected failure", async () => {
    const { status, body } = await fetchProcedure("unexpected");

    expect(status).toBe(500);
    expect(body.error.json.data.code).toBe("INTERNAL_SERVER_ERROR");
    expect(body.error.json.message).toBe(
      "Something went wrong. Please try again.",
    );
  });

  // A precondition failure is the case masking would hurt most: the five Jira
  // screens answer with it, and their copy is the whole point of decision 5.
  it("leaves the copy of a second-level subclass untouched", async () => {
    const { status, body } = await fetchProcedure("jira");

    expect(status).toBe(412);
    expect(body.error.json.message).toBe(
      "The Jira connection needs to be re-authorized.",
    );
  });
});
