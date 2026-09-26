# TypeScript guidelines

Small, near-universal. Read for any `.ts` / `.tsx` work.

## Type definition

- Use `type` over `interface` for object shapes. Enforced by
  `@typescript-eslint/consistent-type-definitions` on `apps/web/src/**`.
- Use `interface` only for extensible contracts. **Prose only**: the rule above admits no
  exception, so an extensible contract that genuinely needs declaration merging is a disable
  comment with a reason.
- An import used only as a type is marked as a type. Enforced by
  `@typescript-eslint/consistent-type-imports` on `apps/web/src/**`, whose autofix writes a
  separate `import type { … }` statement. Preferring that separate statement over an inline `type`
  specifier is **prose only**. It also keeps the client boundary honest: a client module may import server
  code for its types alone, and the import says so.
- Prefer union types over `enum`. Enforced by `local/no-restricted-patterns`, whose message names
  the alternative: a `const` object plus a union of its values.
- Use `const` assertions for literal types. **Prose only**, no rule.

## Type inference

**Prose only**, no rule, for this whole section: a redundant annotation is still correct
TypeScript, so this is a review judgement rather than a failure.

- Omit function return type annotations.
- Omit variable types when obvious.
- Let generics infer from usage.
- Avoid redundant type annotations.

## Language

**Prose only**, no rule. A language detector over identifiers and copy would misreport product
names, provider vocabulary and generated strings.

- Code identifiers, comments, filenames, schemas: English only.
- User-facing strings: English only. Tone rules are in [frontend.md](frontend.md).
