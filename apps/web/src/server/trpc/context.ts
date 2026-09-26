import { auth } from "@/server/auth";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { prisma } from "@workspace/db";
import { headers } from "next/headers";

export async function createContext(opts?: FetchCreateContextFnOptions) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  return {
    prisma,
    session,
    headers: requestHeaders,
    ...opts,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
