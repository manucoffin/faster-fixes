import { TRPCError } from "@trpc/server";

export function handleTRPCError(error: unknown, message?: string) {
  console.error("TRPC Error:", error);

  if (error instanceof TRPCError) {
    throw error; // Re-throw known tRPC errors
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message:
      message ||
      "Une erreur inattendue est survenue, veuillez réessayer plus tard.",
  });
}
