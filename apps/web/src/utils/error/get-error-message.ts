/**
 * Read a displayable message from a failed query.
 *
 * `matchQueryStatus` hands its `Errored` branch an `unknown`: a tRPC query
 * failure is an `Error` carrying final copy for a `DomainError` and the masked
 * sentence for anything unexpected, so anything else falls back to that same
 * sentence rather than being stringified into the UI.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
