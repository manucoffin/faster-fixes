import { createContext } from "@/server/trpc/context";
import { logTRPCError } from "@/server/trpc/log-trpc-error";
import { appRouter } from "@/server/trpc/routers/_app";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    onError: logTRPCError,
  });

export { handler as GET, handler as POST };
