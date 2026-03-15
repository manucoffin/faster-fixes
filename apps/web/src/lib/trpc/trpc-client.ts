import type { AppRouter } from "@/server/trpc/routers/_app";
import type { QueryClient } from "@tanstack/react-query";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { makeQueryClient } from "./query-client";

export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();

let clientQueryClientSingleton: QueryClient;
export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  return (clientQueryClientSingleton ??= makeQueryClient());
}

export function getUrl() {
  const base = (() => {
    if (typeof window !== "undefined") return "";
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
  })();
  return `${base}/api/trpc`;
}
