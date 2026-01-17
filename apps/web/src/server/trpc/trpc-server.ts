import "server-only"; // <-- ensure this file cannot be imported from the client

import { makeQueryClient } from "@/lib/trpc/query-client";
import { appRouter } from "@/server/trpc/routers/_app";
import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { cache } from "react";
import { createContext } from "./context";
import { createCallerFactory } from "./trpc";

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);
const caller = createCallerFactory(appRouter)(createContext);

export const { trpc, HydrateClient } = createHydrationHelpers<typeof appRouter>(
  caller,
  getQueryClient
);
