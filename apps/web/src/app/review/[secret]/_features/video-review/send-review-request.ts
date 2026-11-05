/** A refusal from the review API, carrying the code the page branches on. */
export class ReviewRequestError extends Error {
  constructor(
    message: string,
    readonly code: string | null,
  ) {
    super(message);
    this.name = "ReviewRequestError";
  }
}

/** A write to the review API of a Share link, answering the JSON body or throwing its `{ error, code }`. */
export async function sendReviewRequest<T>(
  secret: string,
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(
    `/api/v1/review/${encodeURIComponent(secret)}${path}`,
    init,
  );

  const body: unknown = await response.json().catch(() => null);
  if (response.ok) return body as T;

  const error = body as { error?: string; code?: string } | null;
  throw new ReviewRequestError(
    error?.error ?? "Something went wrong. Please try again.",
    error?.code ?? null,
  );
}
