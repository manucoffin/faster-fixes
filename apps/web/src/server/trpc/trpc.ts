import { checkRateLimit } from "@/server/api/check-rate-limit";
import { DomainError } from "@/server/errors/domain-errors";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { Context } from "./context";

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson, // allows for more complex data types (like Dates) to be serialized/deserialized properly between client and server.
  errorFormatter(opts) {
    const { shape, error } = opts;
    return {
      ...shape,
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
export const mergeRouters = t.mergeRouters;

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

export const adminProcedure = protectedProcedure.use((opts) => {
  const { session } = opts.ctx;

  if (session.user.role !== "admin") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
    });
  }

  return opts.next({ ctx: { session } });
});

// check this to implement in server actions: https://github.com/trpc/examples-next-app-dir/blob/main/src/server/trpc.ts
