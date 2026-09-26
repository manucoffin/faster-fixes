/**
 * The transport's logging half of ADR 0012. Masking an `INTERNAL_SERVER_ERROR`
 * message in the `errorFormatter` only stays debuggable if the original
 * failure is written server-side first, so every tRPC failure is logged with
 * its whole `cause` chain. Exported rather than inlined in the route handler,
 * so the transport test drives the same function tRPC calls in production.
 */

import type { TRPCError } from "@trpc/server";

type TRPCErrorReport = {
  error: TRPCError;
  path: string | undefined;
  type: "query" | "mutation" | "subscription" | "unknown";
};

// The reason for a failure is rarely the top error: a service's `DomainError`
// arrives wrapped in a `TRPCError`, and it may itself wrap the Prisma or
// Atlassian error that caused it. `seen` stops a chain that points back at
// itself from looping.
function collectCauseChain(error: unknown): unknown[] {
  const chain: unknown[] = [];
  const seen = new Set<unknown>([error]);
  let cause: unknown = error instanceof Error ? error.cause : undefined;

  while (cause !== undefined && !seen.has(cause)) {
    chain.push(cause);
    seen.add(cause);
    cause = cause instanceof Error ? cause.cause : undefined;
  }

  return chain;
}

export function logTRPCError({ error, path, type }: TRPCErrorReport): void {
  console.error(
    `tRPC ${type} ${path ?? "<unknown path>"} failed with ${error.code}`,
    error,
    ...collectCauseChain(error),
  );
}
