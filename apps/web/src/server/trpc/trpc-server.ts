import "server-only";

import { makeQueryClient } from "@/lib/trpc/query-client";
import { appRouter } from "@/server/trpc/routers/_app";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache } from "react";
import { createContext } from "./context";

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

// Server-side tRPC proxy — calls procedures directly, no HTTP round-trip
export const trpc = createTRPCOptionsProxy({
  ctx: createContext,
  router: appRouter,
  queryClient: getQueryClient,
});
