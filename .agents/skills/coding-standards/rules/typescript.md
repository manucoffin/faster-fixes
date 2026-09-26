# TypeScript guidelines

Small, near-universal. Read for any `.ts` / `.tsx` work.

## Type definition

- Use `type` over `interface` for object shapes. Enforced by
  `@typescript-eslint/consistent-type-definitions` on every workspace's `src/**`.
- Use `interface` only for extensible contracts. **Prose only**: the rule above admits no
  exception, so an extensible contract that genuinely needs declaration merging is a disable
  comment with a reason.
- An import used only as a type is marked as a type. Enforced by
  `@typescript-eslint/consistent-type-imports` on every workspace's `src/**`, whose autofix writes a
  separate `import type { … }` statement. Preferring that separate statement over an inline `type`
  specifier is **prose only**. It also keeps the client boundary honest: a client module may import server
  code for its types alone, and the import says so.
- Prefer union types over `enum`. Enforced by `local/no-restricted-patterns`, whose message names
  the alternative: a `const` object plus a union of its values.
- Use `const` assertions for literal types. **Prose only**, no rule.

## Type inference

**Prose only** for this section, bar one rule: a redundant annotation is still correct
TypeScript, so this is a review judgement rather than a failure.

- Omit function return type annotations.
- Omit variable types when obvious. An annotation on a literal (`const n: number = 1`) is reported
  by `@typescript-eslint/no-inferrable-types`.
- Let generics infer from usage.
- Avoid redundant type annotations. An `as X` that changes nothing is reported by
  `@typescript-eslint/no-unnecessary-type-assertion`.

## Type-aware checks

Enforced on every workspace's `src/**` through the TypeScript project service, so the generated
types (package builds, Prisma client, Next.js route types) must exist before lint runs. Each one
catches what `tsc` accepts:

- `await-thenable` and `no-misused-promises`: an `await` on a non-promise, or an async function
  passed where a sync callback is expected. JSX attributes are exempt (`onClick={async () => …}`).
- `no-floating-promises`: every promise is awaited, returned or marked `void`. Return or await an
  invalidation in `onSuccess`/`onSettled` so the mutation stays pending until fresh data lands;
  `void` is for a deliberate fire-and-forget, such as a `nuqs` setter.
- The `no-unsafe-*` family: an `any` assigned, passed as an argument, read from, returned or called,
  and an enum compared to an untyped literal. Data from outside the type system (`JSON.parse`,
  `postMessage`, a fetch body, a webhook payload) is parsed with Zod rather than cast with `as T`.
  Inngest events are typed once, in `src/server/inngest/events.ts`, so `event.data` is never `any`.
  `no-unsafe-assignment` is off in `*.test.ts(x)`, where a loosely typed assertion value is the point.
- `restrict-template-expressions` and `no-base-to-string`: a value that would print
  `[object Object]`. Narrow `unknown` to a string first (`typeof x === "string"`).
- `no-deprecated`: an API marked `@deprecated`. Use the replacement its message names
  (`z.email()`, `z.url()`, `z.uuid()`, `z.flattenError()`).
- `only-throw-error`: only `Error` instances are thrown.
- `switch-exhaustiveness-check`: a `switch` over a union handles every member or has a `default`.
- `no-unnecessary-condition`: a `?.`, `??` or `if` the types already settle. Drop the guard when the
  type is right; fix the type at its source when it lies (external data, a mistyped library value).
  Never silence it with a cast.
- `prefer-nullish-coalescing`: `??` over `||`. When `""`, `0` or `false` must fall back too, write
  the comparison out (`value === "" ? fallback : value`).
- `no-non-null-assertion`: no `x!`. Narrow with a guard, or throw a named error when the invariant
  breaks (a domain error in a service). A required environment variable is read with
  `requireEnv("NAME", process.env.NAME)` (`@/utils/environment/require-env`), and the auth origin
  with `getAuthBaseUrl()` (`@/utils/url/get-auth-base-url`). Off in `*.test.ts(x)`.
- `return-await: in-try-catch`: a promise returned inside `try` is awaited, so its rejection reaches
  the `catch`; elsewhere it is returned bare.

Syntactic, on the same glob: `no-console` (`console.info`, `warn` and `error` are the deliberate log
lines; `log` and `debug` are debugging leftovers), `prefer-template` and `curly: multi-line`.

## Language

**Prose only**, except that identifiers are held to ASCII by `id-match`. A language detector over
identifiers and copy would misreport product names, provider vocabulary and generated strings.

- Code identifiers, comments, filenames, schemas: English only.
- User-facing strings: English only. Tone rules are in [frontend.md](frontend.md).
