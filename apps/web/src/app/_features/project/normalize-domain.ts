import z from "zod";

const LABEL_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)$/;

function isValidDomain(value: string): boolean {
  const parts = value.split(".");
  if (parts.length < 2) return false;
  for (const part of parts) {
    if (!LABEL_REGEX.test(part)) return false;
  }
  // TLD must be at least two letters (no all-numeric, no IP)
  return /^[a-z]{2,}$/.test(parts[parts.length - 1]!);
}

/**
 * Normalize a user-provided domain or URL to a bare hostname.
 *
 * Accepts: "https://www.acme.com/path", "www.acme.com", "ACME.COM:8080".
 * Returns: "acme.com" (lowercased, no scheme/path/port/www.).
 * Returns null when the input cannot be reduced to a valid domain.
 */
export function normalizeDomain(input: string): string | null {
  let value = input.trim().toLowerCase();
  if (!value) return null;

  if (/^[a-z][a-z0-9+.-]*:\/\//.test(value)) {
    try {
      value = new URL(value).hostname;
    } catch {
      return null;
    }
  } else {
    value = value.split("/")[0]!.split("?")[0]!.split("#")[0]!;
  }

  value = value.replace(/:\d+$/, "");
  value = value.replace(/^www\./, "");
  value = value.replace(/\.$/, "");

  return isValidDomain(value) ? value : null;
}

export const DomainSchema = z
  .string()
  .trim()
  .min(1, "Domain is required")
  .transform((value, ctx) => {
    const normalized = normalizeDomain(value);
    if (!normalized) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid domain (e.g. example.com).",
      });
      return z.NEVER;
    }
    return normalized;
  });
