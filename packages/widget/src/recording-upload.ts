import { ApiError } from "@fasterfixes/core";

/**
 * Sends a Recording once, and once more after a network error. A refusal is
 * final. Never rejects and logs nothing: a Recording is best-effort.
 */
export async function uploadRecording(attach: () => Promise<void>) {
  try {
    await attach();
  } catch (error) {
    if (error instanceof ApiError) return;
    await attach().catch(() => undefined);
  }
}
