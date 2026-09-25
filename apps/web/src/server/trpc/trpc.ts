import "server-only";

import { checkRateLimit } from "@/server/rate-limit/check-rate-limit";
import { DomainError } from "@/server/errors/domain-errors";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { Context } from "./context";

// The one sentence a User reads for a failure nobody planned for. Every
// expected failure travels as a `DomainError` and is remapped below, off
// `INTERNAL_SERVER_ERROR`, so masking that code can no longer swallow copy a
// User needs to act on.
const UNEXPECTED_FAILURE_MESSAGE = "Something went wrong. Please try again.";

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson, // allows for more complex data types (like Dates) to be serialized/deserialized properly between client and server.
  errorFormatter(opts) {
    const { shape, error } = opts;
    return {
      ...shape,
      // ADR 0012: an internal message (a Prisma failure, a provider's wording,
      // a missing secret) must never reach a client. `logTRPCError` has
      // already written the original with its `cause` chain, so nothing is
      // lost server-side.
      message:
        error.code === "INTERNAL_SERVER_ERROR"
          ? UNEXPECTED_FAILURE_MESSAGE
          : shape.message,
      data: {
        ...shape.data,
        zodError:
          error.code === "BAD_REQUEST" && error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});

/**
 * Create a server-side caller
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

// Export t.router, t.procedure, t.middleware for creating routers, procedures, and middlewares
export const router = t.router;
export const middleware = t.middleware;

// Maps the transport-agnostic vocabulary back to tRPC with the same code and
// message, so an expected failure never surfaces as a 500. It sits on the base
// procedure, so protected, admin and plan-aware procedures inherit it and no
// procedure needs a try/catch for translation.
const domainErrorMiddleware = t.middleware(async (opts) => {
  const result = await opts.next();

  if (!result.ok && result.error.cause instanceof DomainError) {
    throw new TRPCError({
      code: result.error.cause.code,
      message: result.error.cause.message,
      cause: result.error.cause,
    });
  }

  return result;
});

export const publicProcedure = t.procedure.use(domainErrorMiddleware);

// Procedure that requires authentication
export const protectedProcedure = publicProcedure
  .use((opts) => {
    const { session } = opts.ctx;

    if (!session || !session.user || !session.user.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
      });
    }

    return opts.next({ ctx: { session } });
  })
  .use(async (opts) => {
    const { allowed } = await checkRateLimit(opts.ctx.session.user.id, "trpc");
    if (!allowed) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
    }
    return opts.next();
  });

// The caller is signed in, so a missing role is a permission fact (ADR 0012):
// 403, not 401.
export const adminProcedure = protectedProcedure.use((opts) => {
  const { session } = opts.ctx;

  if (session.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
    });
  }

  return opts.next({ ctx: { session } });
});
