type RecordingDiagnosticCounts = {
  consoleErrors: number;
  failedRequests: number;
};

function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/**
 * The Recording row's one-line summary of the Diagnostic Trail, or `null` when
 * there is nothing to count: a count of zero is never printed.
 */
export function formatRecordingSummary({
  consoleErrors,
  failedRequests,
}: RecordingDiagnosticCounts): string | null {
  const parts = [
    consoleErrors > 0 ? plural(consoleErrors, "console error") : null,
    failedRequests > 0 ? plural(failedRequests, "failed request") : null,
  ].filter((part) => part !== null);
  return parts.length > 0 ? parts.join(", ") : null;
}
