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

// Export t.router, t.procedure for creating routers and procedures
export const router = t.router;
export const publicProcedure = t.procedure.use(async ({ next }) => {
  return await next();
});

// Procedure that requires authentication
export const protectedProcedure = publicProcedure.use((opts) => {
  const { session } = opts.ctx;

  if (!session || !session.user || !session.user.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
    });
  }

  return opts.next({ ctx: { session } });
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
