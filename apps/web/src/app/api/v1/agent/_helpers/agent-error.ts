import { NextResponse } from "next/server";

type AgentErrorOptions = {
  /** Extra response headers (e.g. Retry-After, X-RateLimit-*) */
  headers?: Record<string, string>;
  /** Extra fields merged into the JSON body alongside error/code */
  extra?: Record<string, unknown>;
};

export function agentError(
  message: string,
  code: string,
  status: number,
  options?: AgentErrorOptions,
): NextResponse {
  return NextResponse.json(
    { error: message, code, ...options?.extra },
    { status, headers: options?.headers },
  );
}
