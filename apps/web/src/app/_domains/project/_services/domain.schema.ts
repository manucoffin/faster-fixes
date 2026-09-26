import z from "zod";

import { normalizeDomain } from "../_helpers/normalize-domain";

/**
 * A user-provided domain or URL, reduced to a bare hostname.
 *
 * The transform rejects anything `normalizeDomain` cannot reduce, so a parsed
 * value is always a valid hostname with no scheme, port, path or `www.`.
 */
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

export type DomainInput = z.infer<typeof DomainSchema>;
