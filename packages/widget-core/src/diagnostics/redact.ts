import { DIAGNOSTICS_REDACT_PARAMS } from "../constants.js";

const REDACTED = "[redacted]";

// Normalise so `access_token`, `access-token` and `accessToken` collapse to the
// same key, letting a small denylist cover the common spellings.
function normalizeParam(name: string): string {
  return name.toLowerCase().replace(/[_-]/g, "");
}

const REDACT_SET = new Set(DIAGNOSTICS_REDACT_PARAMS.map(normalizeParam));

/** Whether a name matches the Diagnostic Trail's sensitive-parameter denylist. */
export function isSensitiveParam(name: string): boolean {
  return REDACT_SET.has(normalizeParam(name));
}

/**
 * Strip the *values* of sensitive query params from a URL while keeping the
 * keys, scheme, host and path. Done client-side so secrets never leave the
 * host page. Best-effort: an unparseable URL is returned unchanged.
 */
export function redactUrl(rawUrl: string): string {
  try {
    const base =
      typeof window !== "undefined" ? window.location.href : undefined;
    const url = new URL(rawUrl, base);

    // Snapshot keys first — mutating searchParams while iterating its live
    // key iterator can skip entries.
    const keys = [...url.searchParams.keys()];
    let changed = false;
    for (const key of keys) {
      if (isSensitiveParam(key)) {
        url.searchParams.set(key, REDACTED);
        changed = true;
      }
    }

    return changed ? url.toString() : rawUrl;
  } catch {
    return rawUrl;
  }
}
